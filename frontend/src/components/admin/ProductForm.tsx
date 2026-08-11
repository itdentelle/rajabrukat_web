"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

interface ProductFormProps {
  initialData?: any;
  productId?: string;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, productId, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Brukat Tile Mutiara",
    description: "",
    image: "",
    galleryImages: [] as string[],
    colors: [] as string[],
    sizeGuide: "",
    stock: "100",
  });
  const [discountType, setDiscountType] = useState<"none" | "nominal" | "percentage">("none");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price ? initialData.price.toString() : "",
        category: initialData.category || "T-Shirt",
        description: initialData.description || "",
        image: initialData.image || "",
        galleryImages: initialData.galleryImages || [],
        colors: initialData.colors || [],
        sizeGuide: initialData.sizeGuide || "",
        stock: initialData.stock !== undefined ? initialData.stock.toString() : "100",
      });
      if (initialData.discountPrice && initialData.price) {
        setDiscountType("nominal");
        setDiscountValue((initialData.price - initialData.discountPrice).toString());
      }
    }
  }, [initialData]);

  const [sizeGuideFile, setSizeGuideFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mainImageUrl = formData.image;
      let newGalleryUrls: string[] = [...formData.galleryImages];
      let sizeGuideUrl = formData.sizeGuide;

      if (imageFile || galleryFiles.length > 0 || sizeGuideFile) {
        setUploadingImage(true);

        // Upload main image
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, imageFile);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          mainImageUrl = publicUrlData.publicUrl;
        }

        // Upload gallery images
        for (const file of galleryFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `gal_${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          newGalleryUrls.push(publicUrlData.publicUrl);
        }

        // Upload size guide image
        if (sizeGuideFile) {
          const fileExt = sizeGuideFile.name.split('.').pop();
          const fileName = `sg_${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, sizeGuideFile);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          sizeGuideUrl = publicUrlData.publicUrl;
        }

        setUploadingImage(false);
      }

      const url = isEdit 
        ? `${API_BASE_URL}/api/products/${productId}` 
        : `${API_BASE_URL}/api/products`;
        
      const method = isEdit ? "PUT" : "POST";

      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      let computedDiscountPrice: number | null = null;
      if (discountType !== "none" && discountValue && formData.price) {
        const originalPrice = parseInt(formData.price);
        if (discountType === "percentage") {
          computedDiscountPrice = originalPrice - (originalPrice * parseInt(discountValue) / 100);
        } else if (discountType === "nominal") {
          computedDiscountPrice = originalPrice - parseInt(discountValue);
        }
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          image: mainImageUrl,
          galleryImages: newGalleryUrls,
          colors: formData.colors.map(c => c.trim()).filter(c => c.length > 0),
          price: parseInt(formData.price),
          discountPrice: computedDiscountPrice,
          sizeGuide: sizeGuideUrl,
          stock: parseInt(formData.stock) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Product saved successfully!");
        router.push("/admin/products");
      } else {
        toast.error("Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (Rp)</label>
          <input
            type="number"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            list="category-suggestions"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            placeholder="Kategori Kain"
          />
          <datalist id="category-suggestions">
            <option value="Brukat Tile Mutiara" />
            <option value="Renda Chantilly" />
            <option value="Cornely 3D" />
            <option value="Brukat Cord" />
            <option value="Silk & Satin" />
            <option value="Brukat Premium" />
            <option value="Metallic" />
            <option value="Panel Full Metalic" />
            <option value="Panel Brukat Polos" />
            <option value="Katun & Furing" />
          </datalist>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Diskon / Potongan Harga</label>
        <div className="flex items-center space-x-4">
          <select
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value as "none" | "nominal" | "percentage");
              setDiscountValue("");
            }}
            className="block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
          >
            <option value="none">Tidak Ada Diskon</option>
            <option value="nominal">Nominal (Rp)</option>
            <option value="percentage">Persentase (%)</option>
          </select>

          {discountType !== "none" && (
            <input
              type="number"
              placeholder={discountType === "percentage" ? "Contoh: 20" : "Contoh: 15000"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="block w-2/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          )}
        </div>
        {discountType !== "none" && discountValue && formData.price && (
          <p className="mt-2 text-sm text-green-600">
            Harga akhir setelah diskon: Rp {(
              discountType === "percentage" 
              ? parseInt(formData.price) - (parseInt(formData.price) * parseInt(discountValue) / 100) 
              : parseInt(formData.price) - parseInt(discountValue)
            ).toLocaleString("id-ID")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors mt-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                setImageFile(file);
                const objectUrl = URL.createObjectURL(file);
                setFormData({ ...formData, image: objectUrl });
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 mx-auto"
          />
          <p className="mt-3 text-xs text-gray-500">
            <strong>Rekomendasi Gambar Utama:</strong> Gunakan gambar orientasi Kotak (1:1), minimal resolusi <strong>1080x1080px</strong>. Pastikan latar belakang bersih/netral agar produk menonjol. Format JPG/PNG/WEBP, maksimal ukuran 2MB.
          </p>
        </div>
        {formData.image && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Image Preview:</p>
            <img 
              src={formData.image} 
              alt="Preview" 
              className="h-32 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => setPreviewImage(formData.image)}
            />
          </div>
        )}
        {uploadingImage && <p className="text-xs text-blue-500 mt-2">Uploading image to Supabase...</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gallery Images (Optional)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors mt-1">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                setGalleryFiles(files);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 mx-auto"
          />
          <p className="mt-3 text-xs text-gray-500">
            <strong>Rekomendasi Galeri:</strong> Anda dapat memilih beberapa gambar sekaligus. Gunakan orientasi dan ukuran yang sama dengan gambar utama (Kotak 1:1, minimal 1080x1080px) agar tampilan galeri produk terlihat rapi.
          </p>
        </div>
        {(formData.galleryImages.length > 0 || galleryFiles.length > 0) && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Gallery Preview:</p>
            <div className="grid grid-cols-4 gap-4">
              {formData.galleryImages.map((url, idx) => (
                <img 
                  key={`existing-${idx}`} 
                  src={url} 
                  alt={`Gallery ${idx}`} 
                  className="h-32 w-full object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => setPreviewImage(url)}
                />
              ))}
              {galleryFiles.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <img 
                    key={`new-${idx}`} 
                    src={objectUrl} 
                    alt={`New Gallery ${idx}`} 
                    className="h-32 w-full object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => setPreviewImage(objectUrl)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Size Guide Image (Optional)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors mt-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                setSizeGuideFile(file);
                const objectUrl = URL.createObjectURL(file);
                setFormData({ ...formData, sizeGuide: objectUrl });
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 mx-auto"
          />
          <p className="mt-3 text-xs text-gray-500">
            <strong>Rekomendasi Panduan Ukuran:</strong> Gunakan gambar tabel panduan ukuran yang jelas, direkomendasikan orientasi Kotak atau Lanskap. Format JPG/PNG/WEBP, maksimal 2MB.
          </p>
        </div>
        {formData.sizeGuide && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Size Guide Preview:</p>
            <img 
              src={formData.sizeGuide} 
              alt="Size Guide Preview" 
              className="h-32 object-contain rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => setPreviewImage(formData.sizeGuide)}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Available Colors</label>
        
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Quick Add Templates:</p>
          <div className="flex flex-wrap gap-2">
            {["Black", "White", "Gray", "Navy", "Red", "Blue", "Green"].map(templateColor => (
              <button
                key={templateColor}
                type="button"
                onClick={() => {
                  if (!formData.colors.includes(templateColor)) {
                    setFormData({ ...formData, colors: [...formData.colors, templateColor] });
                  }
                }}
                className="text-xs border border-gray-300 rounded px-3 py-1 hover:border-black transition-colors"
              >
                + {templateColor}
              </button>
            ))}
          </div>
        </div>
        {formData.colors.map((color, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Black"
              value={color}
              onChange={(e) => {
                const newColors = [...formData.colors];
                newColors[index] = e.target.value;
                setFormData({ ...formData, colors: newColors });
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const newColors = formData.colors.filter((_, i) => i !== index);
                setFormData({ ...formData, colors: newColors });
              }}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setFormData({ ...formData, colors: [...formData.colors, ""] });
          }}
          className="mt-2 text-sm text-black border border-black px-3 py-1 rounded hover:bg-black hover:text-white transition-colors"
        >
          + Add Color
        </button>
        <p className="text-xs text-gray-500 mt-2">Leave empty to not offer color variants.</p>
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="bg-black border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-gray-800 focus:outline-none disabled:opacity-50"
        >
          {loading || uploadingImage ? "Saving..." : "Save Product"}
        </button>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              type="button"
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors z-[101]"
              onClick={() => setPreviewImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={previewImage} 
              alt="Enlarged Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </form>
  );
}
