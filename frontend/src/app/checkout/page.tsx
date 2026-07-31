"use client";

import { useCartStore } from "@/store/cartStore";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  
  // Shipping State
  const [searchQuery, setSearchQuery] = useState("");
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [costs, setCosts] = useState<any[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    addressDetail: "",
    courier: ""
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to access checkout.");
      router.push("/register");
      return;
    }

    // Fetch profile
    fetch("http://localhost:5000/api/users/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Invalid session");
        return res.json();
      })
      .then(data => {
        let parsedAddress: any = {};
        try {
          parsedAddress = JSON.parse(data.address || "{}");
        } catch(e) {
          parsedAddress = { streetAddress: data.address || "" };
        }

        const fullAddressArr = [
          parsedAddress.streetAddress,
          parsedAddress.apartment,
          parsedAddress.subdistrict ? `Kecamatan ${parsedAddress.subdistrict}` : "",
          parsedAddress.city,
          parsedAddress.province,
          parsedAddress.postalCode
        ].filter(Boolean);

        const mergedAddress = fullAddressArr.join(", ");

        setFormData(prev => ({
          ...prev,
          customerName: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          addressDetail: mergedAddress || "",
        }));
        
        if (parsedAddress.subdistrict || parsedAddress.city) {
           setSearchQuery(`${parsedAddress.subdistrict || ''} ${parsedAddress.city || ''}`.trim());
        }
      })
      .catch(() => {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });
  }, [router]);

  // Fetch Destinations when searchQuery changes
  useEffect(() => {
    if (searchQuery.length < 3) {
      setDestinations([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`http://localhost:5000/api/shipping/search?q=${searchQuery}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDestinations(data);
            setIsDropdownOpen(true);
          } else {
            setDestinations([]);
          }
        })
        .catch(err => console.error("Error searching destinations", err));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch Cost when destination and courier are selected
  useEffect(() => {
    if (!selectedDestination || !formData.courier) return;

    const weight = items.reduce((total, item) => total + (500 * item.quantity), 0);

    fetch("http://localhost:5000/api/shipping/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: selectedDestination.id.toString(),
        weight: weight || 500, // Minimal 500g
        courier: formData.courier
      })
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCosts(data);
          if (data.length > 0) {
            const defaultService = data[0];
            setShippingCost(defaultService.cost);
            setShippingMethod(`${formData.courier.toUpperCase()} ${defaultService.service}`);
          }
        } else {
          setCosts([]);
          setShippingCost(0);
          setShippingMethod("");
        }
      })
      .catch(err => {
        console.error("Error fetching cost", err);
        setCosts([]);
      });
  }, [selectedDestination, formData.courier, items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedService = costs.find(c => c.service === e.target.value);
    if (selectedService) {
      setShippingCost(selectedService.cost);
      setShippingMethod(`${formData.courier.toUpperCase()} ${selectedService.service}`);
    }
  };

  const handleSelectDestination = (dest: any) => {
    setSelectedDestination(dest);
    setSearchQuery(dest.label);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!selectedDestination) {
      toast.error("Silakan pilih kota/kecamatan tujuan.");
      return;
    }
    
    setLoading(true);

    try {
      const userDataStr = localStorage.getItem("user");
      let userId = undefined;
      if (userDataStr) {
        try {
          const u = JSON.parse(userDataStr);
          userId = u.id;
        } catch(e) {}
      }

      // Gabungkan alamat
      const fullAddress = `${formData.addressDetail}, ${selectedDestination.label}`;

      const payload = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: fullAddress,
        shippingMethod,
        shippingCost,
        userId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        clearCart();
        
        // Redirect to Xendit if available
        if (data.paymentUrl) {
          toast.success("Redirecting to Payment...");
          window.location.href = data.paymentUrl;
        } else {
          toast.success("Order placed successfully!");
          router.push(`/checkout/success?orderId=${data.id}`);
        }
      } else {
        toast.error("Failed to place order.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Checkout</h1>
        <p className="text-gray-500 mb-8">Your cart is empty.</p>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800">
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 lg:py-24">
      <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-12 text-center">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
        {/* Checkout Form */}
        <div className="flex-1">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Shipping Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors"
                  placeholder="081234567890"
                />
              </div>
            </div>

            {/* Address Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Kecamatan/Kota Tujuan</label>
              <input
                type="text"
                placeholder="Ketik minimal 3 huruf kecamatan atau kota..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedDestination(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (destinations.length > 0) setIsDropdownOpen(true);
                }}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors"
              />
              {isDropdownOpen && destinations.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                  {destinations.map(dest => (
                    <div 
                      key={dest.id}
                      onClick={() => handleSelectDestination(dest)}
                      className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {dest.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Detail Alamat</label>
              <textarea 
                name="addressDetail"
                required
                rows={3}
                value={formData.addressDetail}
                onChange={handleChange}
                placeholder="Nama Jalan, Gedung, No. Rumah, RT/RW..."
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors"
              ></textarea>
            </div>

            {/* Courier Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Kurir Pengiriman</label>
                <select
                  name="courier"
                  required
                  value={formData.courier}
                  onChange={handleChange}
                  disabled={!selectedDestination}
                  className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors bg-white disabled:bg-gray-100"
                >
                  <option value="">Pilih Kurir</option>
                  <option value="jne">JNE</option>
                  <option value="sicepat">SiCepat</option>
                  <option value="jnt">J&amp;T</option>
                  <option value="pos">POS Indonesia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Layanan Pengiriman</label>
                <select
                  required
                  onChange={handleServiceChange}
                  disabled={costs.length === 0}
                  className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-colors bg-white disabled:bg-gray-100"
                >
                  <option value="">{costs.length > 0 ? "Pilih Layanan" : "Pilih kurir & kota dulu"}</option>
                  {costs.map(c => (
                    <option key={c.service} value={c.service}>
                      {c.service} - Rp {c.cost.toLocaleString("id-ID")} ({c.etd} hari)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !shippingMethod}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all disabled:opacity-50 mt-8"
            >
              {loading ? "Processing..." : "Place Order & Pay"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3 bg-gray-50 p-6 lg:p-8">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Order Summary</h2>
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4">
                <div className="relative w-16 h-20 bg-gray-200 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold leading-tight">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Qty: {item.quantity} 
                    {item.size && ` | Size: ${item.size}`}
                    {item.color && ` | Color: ${item.color}`}
                  </p>
                  <p className="text-sm font-medium mt-1">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">Rp {totalPrice().toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping {shippingMethod ? `(${shippingMethod})` : ''}</span>
              <span className="font-medium">Rp {shippingCost.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-200">
              <span>Total</span>
              <span>Rp {(totalPrice() + shippingCost).toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
