"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Archive, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:5000/api/products?all=true", {
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
    if (!confirm(`Are you sure you want to ${action} this product?`)) return;
    
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const url = `http://localhost:5000/api/products/${id}${isActive ? '' : '/restore'}`;
      const method = isActive ? "DELETE" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success(`Product ${action}d successfully`);
        fetchProducts(); // refresh list
      } else {
        toast.error(`Failed to ${action} product`);
      }
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      toast.error(`Failed to ${action} product`);
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your clothing catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-md object-cover" src={product.image} alt={product.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Rp {product.price.toLocaleString("id-ID")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {product.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Edit className="w-4 h-4 inline" />
                  </Link>
                  {product.isActive ? (
                    <button onClick={() => handleToggleActive(product.id, true)} className="text-red-600 hover:text-red-900" title="Archive">
                      <Archive className="w-4 h-4 inline" />
                    </button>
                  ) : (
                    <button onClick={() => handleToggleActive(product.id, false)} className="text-green-600 hover:text-green-900" title="Restore">
                      <RotateCcw className="w-4 h-4 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">No products found.</div>
        )}
      </div>
    </div>
  );
}
