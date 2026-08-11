"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShoppingBag, DollarSign, Package } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("token");
            router.push("/admin/login");
            return null;
          }
          const errText = await res.text();
          console.error("Dashboard Stats Error:", res.status, errText);
          throw new Error("Failed to fetch stats");
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setStats(data);
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
    { title: "Total Customers", value: stats.totalUsers, icon: Users, color: "text-purple-600", bg: "bg-purple-100" }
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
