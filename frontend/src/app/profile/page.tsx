"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Package, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { API_BASE_URL } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [profileData, setProfileData] = useState({
    country: "Indonesia",
    firstName: "",
    lastName: "",
    streetAddress: "",
    apartment: "",
    subdistrict: "",
    city: "",
    province: "",
    postalCode: "",
    phone: ""
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleTrackOrder = async (orderId: string) => {
    setTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/track`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTrackingData(data);
      } else {
        toast.error(data.error || "Gagal melacak pesanan");
        setTrackingModalOpen(false);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghubungi server");
      setTrackingModalOpen(false);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const openReviewModal = (productId: string) => {
    setReviewProductId(productId);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${reviewProductId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Ulasan berhasil dikirim!");
        setReviewModalOpen(false);
      } else {
        toast.error(data.error || "Gagal mengirim ulasan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role === 'ADMIN') {
      router.push("/admin/dashboard");
      return;
    }

    // Fetch User Profile
    fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUser(data);
          let parsedAddress: any = {};
          try {
            parsedAddress = JSON.parse(data.address || "{}");
          } catch(e) {
            parsedAddress = { streetAddress: data.address || "" };
          }

            setProfileData({
              country: parsedAddress.country || "Indonesia",
              firstName: parsedAddress.firstName || "",
              lastName: parsedAddress.lastName || "",
              streetAddress: parsedAddress.streetAddress || "",
              apartment: parsedAddress.apartment || "",
              subdistrict: parsedAddress.subdistrict || "",
              city: parsedAddress.city || "",
              province: parsedAddress.province || "",
              postalCode: parsedAddress.postalCode || "",
              phone: data.phone || ""
            });

            // Auto-collapse if address exists
            if (parsedAddress.streetAddress) {
              setIsEditingProfile(false);
            } else {
              setIsEditingProfile(true);
            }
        }
      })
      .catch(console.error);

    // Fetch Orders
    fetch(`${API_BASE_URL}/api/my-orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && (data.orders || Array.isArray(data))) {
          setOrders(data.orders || data);
        } else {
          setOrders([]);
          console.error("Failed to fetch orders, got:", data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setOrders([]);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    useCartStore.getState().clearCart();
    router.push("/login");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini? (Tindakan ini tidak bisa dibatalkan)")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Pesanan berhasil dibatalkan!");
        // Refresh orders
        const updatedRes = await fetch(`${API_BASE_URL}/api/my-orders`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const updatedData = await updatedRes.json();
        setOrders(updatedData);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal membatalkan pesanan");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-24 min-h-[80vh]">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold uppercase mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            
            <button 
              onClick={handleLogout}
              className="flex items-center text-red-600 font-bold uppercase tracking-widest text-sm hover:text-red-800 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 space-y-8">
          
          {/* Shipping Details Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest flex items-center">
                <MapPin className="w-5 h-5 mr-2" /> Shipping Details
              </h2>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black underline transition-colors"
                >
                  Edit Address
                </button>
              )}
            </div>

            {!isEditingProfile ? (
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-bold text-base">{profileData.firstName} {profileData.lastName}</p>
                <p>{profileData.phone}</p>
                <p>{profileData.streetAddress}</p>
                {profileData.apartment && <p>{profileData.apartment}</p>}
                <p>Kecamatan {profileData.subdistrict}, {profileData.city}</p>
                <p>{profileData.province} {profileData.postalCode}</p>
                <p>{profileData.country}</p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setUpdatingProfile(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    method: "PUT",
                    headers: { 
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                      phone: profileData.phone,
                      address: JSON.stringify({
                        country: profileData.country,
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        streetAddress: profileData.streetAddress,
                        apartment: profileData.apartment,
                        subdistrict: profileData.subdistrict,
                        city: profileData.city,
                        province: profileData.province,
                        postalCode: profileData.postalCode
                      })
                    })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    localStorage.setItem("user", JSON.stringify(data));
                    toast.success("Profile updated successfully!");
                    setIsEditingProfile(false);
                  } else {
                    toast.error("Failed to update profile.");
                  }
                } catch(err) {
                  toast.error("Network error.");
                } finally {
                  setUpdatingProfile(false);
                }
              }} className="space-y-4">
                <div>
                  <select 
                    value={profileData.country}
                    onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="Indonesia">Indonesia</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="First name" required
                    value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  />
                  <input 
                    type="text" placeholder="Last name" required
                    value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <input 
                  type="text" placeholder="Address" required
                  value={profileData.streetAddress} onChange={(e) => setProfileData({...profileData, streetAddress: e.target.value})}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                />

                <input 
                  type="text" placeholder="Apartment, suite, etc. (optional)"
                  value={profileData.apartment} onChange={(e) => setProfileData({...profileData, apartment: e.target.value})}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="Subdistrict (Kecamatan)" required
                    value={profileData.subdistrict} onChange={(e) => setProfileData({...profileData, subdistrict: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  />
                  <input 
                    type="text" placeholder="City (Kota/Kabupaten)" required
                    value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select 
                    required
                    value={profileData.province} onChange={(e) => setProfileData({...profileData, province: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="" disabled>Province</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                    <option value="DIY">DIY</option>
                  </select>
                  <input 
                    type="text" placeholder="Postal code" required
                    value={profileData.postalCode} onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <input 
                  type="tel" placeholder="Phone" required
                  value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                />

                <div className="flex gap-4">
                  <button 
                    type="submit"
                    disabled={updatingProfile}
                    className="px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs hover:bg-gray-800 disabled:opacity-50"
                  >
                    {updatingProfile ? "Saving..." : "Save Details"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-3 border border-gray-300 text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">My Orders</h1>
          
          {loading ? (
            <div>Loading your history...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">No Orders Yet</h3>
              <p className="text-gray-500 mb-6">You haven't placed any orders with us.</p>
              <button 
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs hover:bg-gray-800"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-100 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Order #{order.id.split('-')[0]}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                      {(order.trackingNumber || order.biteshipOrderId) && (
                        <button
                          onClick={() => handleTrackOrder(order.id)}
                          className="px-4 py-2 border border-black bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-xs transition-colors rounded-md"
                        >
                          Lacak Paket
                        </button>
                      )}
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 font-bold uppercase tracking-widest text-xs transition-colors rounded-md"
                        >
                          Batalkan Pesanan
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Timeline */}
                  <OrderTimeline status={order.status} />

                  <div className="space-y-4 mt-6">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <img src={item.product?.image} alt={item.product?.name} className="w-16 h-20 object-cover bg-gray-100" />
                        <div className="flex-1 flex justify-between items-start">
                          <div>
                            <h4 className="font-bold uppercase tracking-widest text-sm">{item.product?.name || "Unknown Product"}</h4>
                            <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>
                          {order.status === 'COMPLETED' && (
                            <button 
                              onClick={() => openReviewModal(item.productId)} 
                              className="text-xs font-bold uppercase underline text-gray-500 hover:text-black transition-colors mt-1"
                            >
                              Beri Ulasan
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setTrackingModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              ✕
            </button>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Lacak Pesanan</h3>
            
            {trackingLoading ? (
              <p className="text-gray-500 text-center py-8">Mengambil data pelacakan...</p>
            ) : trackingData ? (
              <div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold uppercase text-gray-500">Status Saat Ini</p>
                  <p className="text-lg font-black uppercase tracking-widest">{trackingData.status}</p>
                </div>
                
                {trackingData.history && trackingData.history.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {trackingData.history.slice().reverse().map((event: any, idx: number) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-black text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg shadow-sm bg-white border border-gray-100">
                          <p className="font-bold text-sm">{event.note || event.status}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(event.updated_at).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada riwayat perjalanan paket.</p>
                )}
              </div>
            ) : (
              <p className="text-red-500 text-center py-8">Gagal memuat pelacakan.</p>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
            <button 
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Beri Ulasan</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none text-3xl transition-transform hover:scale-110"
                    >
                      <span className={star <= reviewRating ? "text-yellow-400" : "text-gray-200"}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Ulasan Anda</label>
                <textarea
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors min-h-[100px] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-black text-white font-bold uppercase tracking-widest text-xs py-3 hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const steps = [
    { key: "PENDING", label: "Pesanan Dibuat" },
    { key: "PROCESSING", label: "Sedang Dikemas" },
    { key: "SHIPPED", label: "Sedang Dikirim" },
    { key: "COMPLETED", label: "Selesai" }
  ];

  const currentIndex = steps.findIndex(s => s.key === status) === -1 ? 0 : steps.findIndex(s => s.key === status);
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="w-full my-6 bg-red-50 p-4 rounded text-red-600 font-bold text-center uppercase tracking-widest text-sm border border-red-200">
        Pesanan Dibatalkan
      </div>
    );
  }

  return (
    <div className="w-full my-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-3 w-full h-1 bg-gray-200 z-0"></div>
        <div 
          className="absolute left-0 top-3 h-1 bg-black z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isCompleted ? "bg-black text-white ring-4 ring-white" : "bg-gray-200 text-gray-400 ring-4 ring-white"
              }`}>
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center max-w-[70px] md:max-w-[100px] leading-tight ${
                isCompleted ? "text-black" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
