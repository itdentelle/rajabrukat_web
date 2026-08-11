"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Archive, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { API_BASE_URL } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE_URL}/api/products?all=true`, {
        // Technically GET /api/products doesn't need auth, but good practice if it did.
        // The backend GET /api/products is public though.
      });
      const data = await res.json();
      setProducts(data.products || data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const action = isActive ? "archive" : "restore";
    if (!confirm(`Apakah Anda yakin ingin mengarsip/mengaktifkan produk ini?`)) return;
    
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const url = `${API_BASE_URL}/api/products/${id}${isActive ? '' : '/restore'}`;
      const method = isActive ? "DELETE" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success(`Produk berhasil di-${action}`);
        fetchProducts(); // refresh list
      } else {
        toast.error(`Gagal ${action} produk`);
      }
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error(`Gagal ${action} produk`);
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`HAPUS PERMANEN: Apakah Anda benar-benar yakin ingin menghapus produk "${name}" secara permanen? Data yang dihapus tidak bisa dikembalikan.`)) return;

    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${id}?force=true`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success("Produk berhasil dihapus permanen");
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus produk");
      }
    } catch (error) {
      console.error("Failed to delete product permanently:", error);
      toast.error("Gagal terhubung ke server");
    }
  };

  if (loading) return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Loading product catalog...</p>
        </div>
      </div>
      <TableSkeleton />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola katalog kain brukat & renda</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 bg-[#b77305] text-white text-sm font-bold rounded-xl hover:bg-[#965e04] transition-colors shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Produk
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Kategori
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Harga
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-stone-500 uppercase tracking-wider min-w-[120px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/admin/products/${product.id}/edit`} className="flex items-center group">
                    <div className="h-12 w-12 flex-shrink-0 relative rounded-xl overflow-hidden border border-stone-200 shadow-xs group-hover:border-[#b77305] transition-colors">
                      <img className="h-12 w-12 object-cover" src={product.image} alt={product.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-stone-900 group-hover:text-[#b77305] transition-colors line-clamp-2">{product.name}</div>
                      <div className="text-xs text-stone-400 font-mono mt-0.5">ID: {product.id.slice(0, 8)}...</div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    {product.category || "General"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900">
                  Rp {product.price?.toLocaleString("id-ID") || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${product.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                    {product.isActive ? 'Aktif' : 'Diarsip'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 text-xs font-bold transition-colors"
                      title="Edit Produk"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>

                    {product.isActive ? (
                      <button
                        onClick={() => handleToggleActive(product.id, true)}
                        className="p-1.5 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                        title="Arsipkan Produk"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(product.id, false)}
                        className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        title="Aktifkan Kembali"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handlePermanentDelete(product.id, product.name)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                      title="Hapus Permanen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">Tidak ada produk ditemukan.</div>
        )}
      </div>
    </div>
  );
}
