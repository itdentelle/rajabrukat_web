"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Archive, RotateCcw, Package, AlertTriangle, CheckCircle2, XCircle, Search, Filter, Check, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { API_BASE_URL } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>("");
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?all=true`);
      const data = await res.json();
      setProducts(data.products || data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStockUpdate = async (id: string, newStock: number) => {
    const validStock = Math.max(0, Math.floor(newStock));
    setSavingStockId(id);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stock: validStock })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: validStock } : p));
        toast.success("Stok berhasil diperbarui!");
        setEditingStockId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui stok");
      }
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setSavingStockId(null);
    }
  };

  const handleQuickColorStockUpdate = async (id: string, color: string, newStock: number) => {
    const validStock = Math.max(0, Math.floor(newStock));
    setSavingStockId(id);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ color, stock: validStock })
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        toast.success(`Stok warna ${color} diperbarui (${validStock} m)!`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui stok warna");
      }
    } catch (error) {
      console.error("Failed to update color stock:", error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setSavingStockId(null);
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
        fetchProducts();
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

  // Stock Summary calculations
  const totalProducts = products.length;
  const inStockCount = products.filter(p => (p.stock ?? 100) > 10).length;
  const lowStockCount = products.filter(p => (p.stock ?? 100) > 0 && (p.stock ?? 100) <= 10).length;
  const outOfStockCount = products.filter(p => (p.stock ?? 100) <= 0).length;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const stockVal = p.stock !== undefined ? p.stock : 100;
    let matchesStock = true;
    if (stockFilter === "in_stock") matchesStock = stockVal > 10;
    if (stockFilter === "low_stock") matchesStock = stockVal > 0 && stockVal <= 10;
    if (stockFilter === "out_of_stock") matchesStock = stockVal <= 0;

    return matchesSearch && matchesStock;
  });

  if (loading) return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Loading product catalog & stock data...</p>
        </div>
      </div>
      <TableSkeleton />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog & Pendataan Stok Per Warna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola daftar kain brukat, harga, serta jumlah ketersediaan stok per varian warna</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#b77305] text-white text-sm font-bold rounded-xl hover:bg-[#965e04] transition-colors shadow-md gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </Link>
      </div>

      {/* Stock Summary Statistics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">{totalProducts}</div>
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Total Produk</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{inStockCount}</div>
            <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Stok Melimpah</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{lowStockCount}</div>
            <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Stok Menipis (≤10)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700">{outOfStockCount}</div>
            <div className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Stok Habis (0)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-stone-500 hidden sm:block" />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full md:w-auto px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#b77305]/20"
          >
            <option value="all">Semua Status Stok ({totalProducts})</option>
            <option value="in_stock">Stok Melimpah ({inStockCount})</option>
            <option value="low_stock">Stok Menipis ({lowStockCount})</option>
            <option value="out_of_stock">Stok Habis ({outOfStockCount})</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider min-w-[260px] max-w-md">
                Produk
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Kategori
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Harga
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Ketersediaan Stok
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">
                Status Katalog
              </th>
              <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-stone-500 uppercase tracking-wider min-w-[140px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {filteredProducts.map((product) => {
              const currentStock = product.stock !== undefined ? product.stock : 100;
              const isLow = currentStock > 0 && currentStock <= 10;
              const isOut = currentStock <= 0;

              return (
                <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                  {/* Product Details */}
                  <td className="px-6 py-4 max-w-md">
                    <Link href={`/admin/products/${product.id}/edit`} className="flex items-start group">
                      <div className="h-12 w-12 flex-shrink-0 relative rounded-xl overflow-hidden border border-stone-200 shadow-xs group-hover:border-[#b77305] transition-colors mt-0.5">
                        <img className="h-12 w-12 object-cover" src={product.image} alt={product.name} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-xs font-bold text-stone-900 group-hover:text-[#b77305] transition-colors leading-snug break-words">{product.name}</div>
                        <div className="text-xs text-stone-400 font-mono mt-1">ID: {product.id.slice(0, 8)}...</div>
                      </div>
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      {product.category || "General"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900">
                    Rp {product.price?.toLocaleString("id-ID") || 0}
                  </td>

                  {/* Read-Only Total Stock Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full border ${
                      isOut
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isLow
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      {isOut ? 'Habis (0 pcs)' : isLow ? `Menipis (${currentStock} pcs)` : `${currentStock} pcs`}
                    </span>
                  </td>

                  {/* Active Catalog Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${product.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                      {product.isActive ? 'Aktif' : 'Diarsip'}
                    </span>
                  </td>

                  {/* Actions */}
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
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">Tidak ada produk ditemukan sesuai filter.</div>
        )}
      </div>
    </div>
  );
}

