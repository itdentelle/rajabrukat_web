"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Archive, RotateCcw, Package, AlertTriangle, CheckCircle2, XCircle, Search, Filter, ArrowUpDown, Check, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import TableSkeleton from "@/components/ui/TableSkeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { API_BASE_URL } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "stock_high" | "stock_low" | "price_high" | "price_low" | "name_asc" | "name_desc">("newest");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>("");
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "archive" | "restore";
    productId: string;
    productName: string;
    productCode?: string;
    productGrade?: string;
  }>({
    isOpen: false,
    type: "delete",
    productId: "",
    productName: "",
    productCode: "",
    productGrade: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

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

  const openArchiveRestoreModal = (product: any, isActive: boolean) => {
    setConfirmModal({
      isOpen: true,
      type: isActive ? "archive" : "restore",
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      productGrade: product.grade,
    });
  };

  const openDeleteModal = (product: any) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      productGrade: product.grade,
    });
  };

  const handleModalConfirm = async () => {
    if (!confirmModal.productId) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");

      if (confirmModal.type === "delete") {
        const res = await fetch(`${API_BASE_URL}/api/products/${confirmModal.productId}?force=true`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          toast.success("Produk berhasil dihapus permanen");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchProducts();
        } else {
          const err = await res.json();
          toast.error(err.error || "Gagal menghapus produk");
        }
      } else {
        const isArchiving = confirmModal.type === "archive";
        const url = `${API_BASE_URL}/api/products/${confirmModal.productId}${isArchiving ? "" : "/restore"}`;
        const method = isArchiving ? "DELETE" : "PUT";

        const res = await fetch(url, {
          method,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          toast.success(isArchiving ? "Produk berhasil diarsipkan" : "Produk berhasil diaktifkan kembali");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchProducts();
        } else {
          toast.error(`Gagal ${isArchiving ? "mengarsipkan" : "mengaktifkan"} produk`);
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setActionLoading(false);
    }
  };

  // Stock Summary calculations
  const totalProducts = products.length;
  const inStockCount = products.filter(p => (p.stock ?? 100) > 10).length;
  const lowStockCount = products.filter(p => (p.stock ?? 100) > 0 && (p.stock ?? 100) <= 10).length;
  const outOfStockCount = products.filter(p => (p.stock ?? 100) <= 0).length;

  // Filtered and Sorted Products
  const filteredProducts = products
    .filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(query) || 
                            (p.code && p.code.toLowerCase().includes(query)) ||
                            (p.category && p.category.toLowerCase().includes(query));
      
      const stockVal = p.stock !== undefined ? p.stock : 100;
      let matchesStock = true;
      if (stockFilter === "in_stock") matchesStock = stockVal > 10;
      if (stockFilter === "low_stock") matchesStock = stockVal > 0 && stockVal <= 10;
      if (stockFilter === "out_of_stock") matchesStock = stockVal <= 0;

      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === "stock_high") {
        return (b.stock ?? 0) - (a.stock ?? 0);
      }
      if (sortBy === "stock_low") {
        return (a.stock ?? 0) - (b.stock ?? 0);
      }
      if (sortBy === "price_high") {
        return (b.price ?? 0) - (a.price ?? 0);
      }
      if (sortBy === "price_low") {
        return (a.price ?? 0) - (b.price ?? 0);
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
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

      {/* Filter, Search, and Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama produk, kode kain (misal: 3947AR), atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Stock Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4 text-stone-500 hidden sm:block shrink-0" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#b77305]/20"
            >
              <option value="all">Semua Status Stok ({totalProducts})</option>
              <option value="in_stock">Stok Melimpah ({inStockCount})</option>
              <option value="low_stock">Stok Menipis ({lowStockCount})</option>
              <option value="out_of_stock">Stok Habis ({outOfStockCount})</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-4 h-4 text-stone-500 hidden sm:block shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#b77305]/20"
            >
              <option value="newest">🕒 Terbaru (Rilis Baru)</option>
              <option value="oldest">⌛ Terlama (Rilis Awal)</option>
              <option value="stock_high">📦 Stok Terbanyak (Tinggi - Rendah)</option>
              <option value="stock_low">⚠️ Stok Paling Sedikit (Rendah - Tinggi)</option>
              <option value="price_high">💎 Harga Tertinggi</option>
              <option value="price_low">🏷️ Harga Terendah</option>
              <option value="name_asc">🔤 Nama Produk (A - Z)</option>
              <option value="name_desc">🔤 Nama Produk (Z - A)</option>
            </select>
          </div>
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
                        {product.code && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#b77305]/10 text-[#b77305] border border-[#b77305]/20">
                              KODE: {product.code}
                            </span>
                          </div>
                        )}
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
                          onClick={() => openArchiveRestoreModal(product, true)}
                          className="p-1.5 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                          title="Arsipkan Produk"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openArchiveRestoreModal(product, false)}
                          className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                          title="Aktifkan Kembali"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => openDeleteModal(product)}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => !actionLoading && setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        isLoading={actionLoading}
        title={
          confirmModal.type === "delete"
            ? "Hapus Produk Permanen?"
            : confirmModal.type === "archive"
            ? "Arsipkan Produk?"
            : "Aktifkan Kembali Produk?"
        }
        description={
          confirmModal.type === "delete" ? (
            <span>
              Apakah Anda benar-benar yakin ingin menghapus produk ini secara permanen?{" "}
              <strong className="text-rose-600 font-semibold block mt-1">
                Data yang dihapus tidak bisa dikembalikan. Seluruh varian warna dan stok terkait akan dihapus.
              </strong>
            </span>
          ) : confirmModal.type === "archive" ? (
            <span>
              Produk yang diarsipkan akan disembunyikan dari katalog toko pembeli, namun data stok dan varian tetap tersimpan dan dapat diaktifkan kembali kapan saja.
            </span>
          ) : (
            <span>
              Produk akan kembali diaktifkan dan ditampilkan di etalase pembeli untuk dapat dipesan kembali.
            </span>
          )
        }
        itemName={confirmModal.productName}
        itemSubtitle={
          [
            confirmModal.productCode ? `Kode: ${confirmModal.productCode}` : null,
            confirmModal.productGrade ? `Grade: ${confirmModal.productGrade}` : null,
          ]
            .filter(Boolean)
            .join(" • ")
        }
        variant={
          confirmModal.type === "delete"
            ? "danger"
            : confirmModal.type === "archive"
            ? "warning"
            : "info"
        }
        confirmText={
          confirmModal.type === "delete"
            ? "Hapus Permanen"
            : confirmModal.type === "archive"
            ? "Ya, Arsipkan"
            : "Ya, Aktifkan"
        }
        cancelText="Batal"
      />
    </div>
  );
}


