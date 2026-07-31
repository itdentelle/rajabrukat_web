"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsupportedPickups, setUnsupportedPickups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:5000/api/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      setOrders(data.orders || data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Update local state to reflect the change immediately
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const handleRequestPickup = async (id: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://localhost:5000/api/orders/${id}/pickup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: 'SHIPPED', trackingNumber: data.trackingNumber } : o));
        toast.success(`Pickup requested! Resi: ${data.trackingNumber}`);
      } else {
        if (data.error && data.error.includes("Courier service type does not exist")) {
          setUnsupportedPickups(prev => ({ ...prev, [id]: true }));
          toast.error("Kurir ini tidak mendukung request pickup.");
        } else {
          toast.error(data.error || "Failed to request pickup");
        }
      }
    } catch (error) {
      console.error("Error requesting pickup:", error);
      toast.error("Error requesting pickup");
    }
  };

  if (loading) return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Loading customer orders...</p>
      </div>
      <TableSkeleton />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage customer orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID & Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.id.split("-")[0]}...</div>
                  <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">{order.customerName}</div>
                  <div className="text-sm text-gray-500">{order.email}</div>
                  <div className="text-xs text-gray-500 mt-1">{order.address}</div>
                </td>
                <td className="px-6 py-4">
                  <ul className="text-sm text-gray-500 list-disc pl-4">
                    {order.items.map((item: any) => (
                      <li key={item.id}>
                        {item.quantity}x {item.product?.name || 'Unknown Product'}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2 items-start">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border outline-none ${
                        order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 
                        order.status === 'PAID' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        order.status === 'PROCESSING' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        order.status === 'COMPLETED' ? 'bg-green-50 text-green-800 border-green-200' :
                        'bg-gray-50 text-gray-800 border-gray-200'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    {order.status === 'PROCESSING' && !order.trackingNumber && (
                      unsupportedPickups[order.id] ? (
                        <div className="mt-2 text-xs text-red-600 font-medium p-1.5 bg-red-50 rounded border border-red-100 w-full text-center">
                          Kurir ini tidak bisa request pick up
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestPickup(order.id)}
                          className="mt-2 text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors shadow-sm font-medium w-full"
                        >
                          Request Pickup
                        </button>
                      )
                    )}

                    {order.trackingNumber && (
                      <div className="mt-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                        Resi: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">No orders found.</div>
        )}
      </div>
    </div>
  );
}
