"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  color: string;
}

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/collections`)
      .then(res => res.json())
      .then(data => {
        setCollections(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load collections");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Collection deleted");
      fetchCollections();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete collection");
    }
  };

  if (loading) return <div className="p-8">Loading collections...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Collections</h1>
          <p className="text-gray-500">Manage your seasonal drops and capsules.</p>
        </div>
        <Link 
          href="/admin/collections/new"
          className="bg-black text-white px-6 py-3 rounded font-bold uppercase tracking-widest hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Collection
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs tracking-widest text-gray-500">
            <tr>
              <th className="p-4 font-bold">Title</th>
              <th className="p-4 font-bold">Subtitle</th>
              <th className="p-4 font-bold">Color Theme</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {collections.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold">{c.title}</td>
                <td className="p-4 text-gray-600">{c.subtitle}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${c.color.split(' ')[0]} border border-gray-300`}></span>
                    <span className="text-sm text-gray-500">{c.color}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest rounded ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/collections/edit/${c.id}`} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No collections found. Create your first one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
