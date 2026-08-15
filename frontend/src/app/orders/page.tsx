"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      toast.error("Anda harus login untuk melihat riwayat pesanan.");
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role === 'ADMIN') {
      router.push("/admin/orders");
      return;
    }

    fetch(`${API_BASE_URL}/api/my-orders`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data pesanan");
        return res.json();
      })
      .then(data => {
        setOrders(data.orders || data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Terjadi kesalahan saat memuat pesanan.");
        setLoading(false);
      });
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PAID": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "SHIPPED": return "bg-purple-100 text-purple-800 border-purple-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-500">Memuat riwayat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 lg:py-24 max-w-5xl">
      <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-12">Riwayat Pesanan</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-6">Anda belum pernah membuat pesanan.</p>
          <button 
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order ID</p>
                  <p className="font-mono font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tanggal</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Belanja</p>
                  <p className="font-bold">Rp {order.totalAmount.toLocaleString("id-ID")}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {(order.trackingNumber || order.biteshipOrderId) && (
                    <button
                      onClick={() => handleTrackOrder(order.id)}
                      className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-800 transition-colors"
                    >
                      Lacak Paket
                    </button>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-6">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-20 h-24 bg-gray-100 flex-shrink-0 rounded-md overflow-hidden">
                        <img 
                          src={item.product?.image || "/placeholder.jpg"} 
                          alt={item.product?.name || "Product"} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{item.product?.name || "Produk Dihapus"}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right font-medium">
                        Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Shipping & Payment Info */}
                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-gray-500 mb-2">Alamat Pengiriman</h4>
                    <p className="text-gray-800 leading-relaxed">{order.address}</p>
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-gray-500 mb-2">Detail Pengiriman</h4>
                    <p className="text-gray-800"><span className="text-gray-500">Kurir:</span> {order.shippingMethod || "Belum dipilih"}</p>
                    <p className="text-gray-800"><span className="text-gray-500">Ongkos Kirim:</span> Rp {order.shippingCost?.toLocaleString("id-ID") || 0}</p>
                    
                    {order.status === "PENDING" && order.paymentUrl && (
                      <div className="mt-4">
                        <a 
                          href={order.paymentUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-block px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                          Lanjutkan Pembayaran
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
