"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShoppingBag, DollarSign, Package, Eye, Smartphone, Monitor, Globe, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    Promise.all([
      fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()).catch(() => null),
      fetch(`${API_BASE_URL}/api/analytics/stats`).then(res => res.json()).catch(() => null),
    ])
      .then(([statsData, analyticsData]) => {
        if (statsData) setStats(statsData);
        if (analyticsData) setAnalytics(analyticsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load dashboard statistics");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="p-8 font-bold text-gray-500 uppercase tracking-widest">Loading Dashboard...</div>;
  }

  if (!stats) return null;

  const statCards = [
    { title: "Total Revenue", value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Pengunjung Hari Ini", value: analytics?.todayCount ?? 0, icon: Eye, color: "text-[#b77305]", bg: "bg-[#b77305]/10" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to your store's command center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <motion.div 
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">{card.title}</p>
              <h3 className="text-3xl font-black">{card.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Revenue Trend (Last 6 Months)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData?.slice().reverse() || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('id-ID')}K`}
                />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Order Status Distribution</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.orderStatusData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visitor Analytics Section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#b77305]" /> Statistik Pengunjung Website
            </h2>
            <p className="text-xs text-stone-500 mt-1">Laporan jumlah pengunjung real-time dan statistik halaman paling diminati</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-stone-700">
              Bulan Ini: <span className="text-[#b77305] font-extrabold">{analytics?.monthCount ?? 0}</span>
            </div>
            <div className="bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-stone-700">
              Total Pengunjung: <span className="text-stone-950 font-extrabold">{analytics?.totalCount ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Daily Visitor Trend Chart */}
          <div className="lg:col-span-7">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Grafik Pengunjung 7 Hari Terakhir</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.dailyChart || []} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                  <Tooltip
                    cursor={{ fill: '#FAF7F2' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e8ded2', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="visits" name="Pengunjung" fill="#b77305" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Visited Pages & Device Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-stone-700" /> Halaman Paling Sering Dikunjungi
              </h3>
              {analytics?.topPages && analytics.topPages.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topPages.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-stone-50 px-3.5 py-2.5 rounded-lg border border-stone-200 text-xs">
                      <span className="font-mono text-stone-800 truncate max-w-[200px]">{item.path === "/" ? "/ (Beranda)" : item.path}</span>
                      <span className="font-bold bg-[#b77305]/10 text-[#b77305] px-2 py-0.5 rounded-full">{item.count} kunjungan</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Belum ada data kunjungan halaman.</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-stone-700" /> Perangkat Pengunjung
              </h3>
              <div className="flex items-center gap-4">
                {analytics?.devices?.map((dev: any) => (
                  <div key={dev.device} className="flex-1 bg-stone-50 p-3 rounded-lg border border-stone-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{dev.device}</span>
                    <span className="text-lg font-black text-stone-900">{dev.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Package className="w-5 h-5" /> Recent Orders
          </h2>
          <button 
            onClick={() => router.push('/admin/orders')}
            className="text-sm font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>
        
        {stats.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-bold">Order ID</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-sm">#{order.id.split('-')[0]}</td>
                    <td className="p-4 text-sm">{order.customerName}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-bold text-sm">Rp {order.totalAmount.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PROCESSING' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No orders found.</div>
        )}
      </div>
    </div>
  );
}
