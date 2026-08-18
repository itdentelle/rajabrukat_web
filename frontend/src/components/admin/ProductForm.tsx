"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";
import { Upload, Image as ImageIcon, Trash2, Plus, X } from "lucide-react";

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
    code: "",
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
  const [fabricInfo, setFabricInfo] = useState("");
  const [fabricLength, setFabricLength] = useState("");
  const [fabricWidth, setFabricWidth] = useState("");

  const [colorStocks, setColorStocks] = useState<Record<string, string>>({});
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, File>>({});

  const extractCode = (name: string): string => {
    if (!name) return "";
    const m = name.match(/\[\s*(?:KODE\s*)?([A-Za-z0-9]+)\s*\]/i) || name.match(/KODE\s*[:\-_]?\s*\[?\s*([A-Za-z0-9]+)\s*\]?/i);
    return m ? m[1].trim().toUpperCase() : "";
  };

  const formatCmToMeterAndCm = (val: string): string => {
    if (!val || !val.trim()) return "";
    if (val.includes("M") && val.includes("cm")) return val;

    const num = parseFloat(val.replace(/[^0-9.]/g, ""));
    if (isNaN(num) || num <= 0) return val;

    const meter = parseFloat((num / 100).toFixed(2));
    return `${meter}M ( ${num} cm )`;
  };

  const extractCmValue = (val: string): string => {
    if (!val) return "";
    const cmMatch = val.match(/(\d+(?:\.\d+)?)\s*cm/i);
    if (cmMatch) return cmMatch[1];
    const numMatch = val.match(/(\d+(?:\.\d+)?)/);
    return numMatch ? numMatch[1] : val;
  };

  useEffect(() => {
    if (initialData) {
      const colors = initialData.colors || [];
      const initColorStocks: Record<string, string> = {};
      if (initialData.colorStocks && typeof initialData.colorStocks === "object") {
        Object.keys(initialData.colorStocks).forEach((c) => {
          initColorStocks[c] = initialData.colorStocks[c].toString();
        });
      } else {
        colors.forEach((c: string) => {
          initColorStocks[c] = "100";
        });
      }

      if (initialData.colorImages && typeof initialData.colorImages === "object") {
        setColorImages(initialData.colorImages);
      }

      const rawDesc = initialData.description || "";
      let parsedFabricInfo = "";
      let parsedDesc = rawDesc;

      // Extract length & width in cm
      const lengthMatch = rawDesc.match(/Panjang\s*1?\s*Kain\s*:\s*([^\n\r]+)/i);
      const widthMatch = rawDesc.match(/Lebar\s*1?\s*Kain\s*:\s*([^\n\r]+)/i);

      setFabricLength(lengthMatch ? extractCmValue(lengthMatch[1].trim()) : "");
      setFabricWidth(widthMatch ? extractCmValue(widthMatch[1].trim()) : "");

      // Clean out length & width from rawDesc before parsing info & desc
      let cleanedRaw = rawDesc
        .replace(/Panjang\s*1?\s*Kain\s*:\s*[^\n\r]+\n?/gi, "")
        .replace(/Lebar\s*1?\s*Kain\s*:\s*[^\n\r]+\n?/gi, "")
        .trim();

      if (cleanedRaw.includes("INFORMASI KAIN:") || cleanedRaw.includes("INFORMASI PRODUK:")) {
        const parts = cleanedRaw.split(/DESKRIPSI PRODUK:|DESKRIPSI:/i);
        if (parts.length >= 2) {
          parsedFabricInfo = parts[0].replace(/INFORMASI KAIN:\s*|INFORMASI PRODUK:\s*/gi, "").trim();
          parsedDesc = parts[1].trim();
        } else {
          parsedFabricInfo = cleanedRaw.replace(/INFORMASI KAIN:\s*|INFORMASI PRODUK:\s*/gi, "").trim();
          parsedDesc = "";
        }
      } else {
        parsedDesc = cleanedRaw;
      }

      setFabricInfo(parsedFabricInfo);
      setColorStocks(initColorStocks);
      setFormData({
        name: initialData.name || "",
        code: initialData.code || extractCode(initialData.name || ""),
        price: initialData.price ? initialData.price.toString() : "",
        category: initialData.category || "Brukat Tile Mutiara",
        description: parsedDesc,
        image: initialData.image || "",
        galleryImages: initialData.galleryImages || [],
        colors: colors,
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

  const updateColorStock = (colorName: string, stockVal: string) => {
    const nextStocks = { ...colorStocks, [colorName]: stockVal };
    setColorStocks(nextStocks);

    // Auto calculate total stock if colors exist
    const total = Object.values(nextStocks).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    setFormData((prev) => ({ ...prev, stock: total.toString() }));
  };

  const handleAddColor = (newColorName: string) => {
    if (!newColorName || formData.colors.includes(newColorName)) return;
    const nextColors = [...formData.colors, newColorName];
    const nextStocks = { ...colorStocks, [newColorName]: "50" };
    setFormData({ ...formData, colors: nextColors });
    setColorStocks(nextStocks);
    const total = Object.values(nextStocks).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    setFormData((prev) => ({ ...prev, stock: total.toString() }));
  };

  const handleRemoveColor = (index: number) => {
    const removedColor = formData.colors[index];
    const newColors = formData.colors.filter((_, i) => i !== index);
    const nextStocks = { ...colorStocks };
    delete nextStocks[removedColor];
    const nextImgs = { ...colorImages };
    delete nextImgs[removedColor];
    const nextFiles = { ...colorImageFiles };
    delete nextFiles[removedColor];

    setFormData({ ...formData, colors: newColors });
    setColorStocks(nextStocks);
    setColorImages(nextImgs);
    setColorImageFiles(nextFiles);

    if (newColors.length > 0) {
      const total = Object.values(nextStocks).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      setFormData((prev) => ({ ...prev, stock: total.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mainImageUrl = formData.image;
      let newGalleryUrls: string[] = [...formData.galleryImages];
      let sizeGuideUrl = formData.sizeGuide;

      const uploadFileWithFallback = async (bucket: string, path: string, file: File): Promise<string> => {
        // 1. Try direct Supabase storage first
        try {
          const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
            if (publicUrlData?.publicUrl) return publicUrlData.publicUrl;
          }
        } catch (e) {
          // Fall through to backend upload
        }

        // 2. Fallback: Convert to Base64 and upload via Backend /api/upload (which uploads to Supabase Storage with Admin Key)
        const dataUrl: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        try {
          const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}/api/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ image: dataUrl }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.url) return json.url;
          }
        } catch (err) {
          console.warn("Backend /api/upload error:", err);
        }

        throw new Error("Gagal mengunggah file gambar ke server. Silakan coba lagi.");
      };

      if (imageFile || galleryFiles.length > 0 || sizeGuideFile || Object.keys(colorImageFiles).length > 0) {
        setUploadingImage(true);

        // Upload main image
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          mainImageUrl = await uploadFileWithFallback('products', fileName, imageFile);
        }

        // Upload gallery images
        for (const file of galleryFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `gal_${Math.random()}.${fileExt}`;
          const url = await uploadFileWithFallback('products', fileName, file);
          newGalleryUrls.push(url);
        }

        // Upload size guide image
        if (sizeGuideFile) {
          const fileExt = sizeGuideFile.name.split('.').pop();
          const fileName = `sg_${Math.random()}.${fileExt}`;
          sizeGuideUrl = await uploadFileWithFallback('products', fileName, sizeGuideFile);
        }
      }

      // Build payload for colorStocks & colorImages
      const activeColors = formData.colors.map(c => c.trim()).filter(c => c.length > 0);
      const payloadColorStocks: Record<string, number> = {};
      const payloadColorImages: Record<string, string> = { ...colorImages };

      // Upload color variant images if files present
      for (const [colorName, file] of Object.entries(colorImageFiles)) {
        if (file && activeColors.includes(colorName)) {
          const fileExt = file.name.split('.').pop();
          const fileName = `color_${colorName.toLowerCase().replace(/\s+/g, '_')}_${Math.random()}.${fileExt}`;
          const uploadedUrl = await uploadFileWithFallback('products', fileName, file);
          payloadColorImages[colorName] = uploadedUrl;
        }
      }

      if (activeColors.length > 0) {
        activeColors.forEach(c => {
          payloadColorStocks[c] = parseInt(colorStocks[c]) || 0;
        });
      }

      setUploadingImage(false);

      const url = isEdit
        ? `${API_BASE_URL}/api/products/${productId}`
        : `${API_BASE_URL}/api/products`;

      const method = isEdit ? "PUT" : "POST";

      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const cleanPrice = parseFloat(String(formData.price || "").replace(/[^0-9.]/g, "")) || 0;
      const cleanStock = parseInt(String(formData.stock || "0").replace(/[^0-9]/g, "")) || 0;

      let computedDiscountPrice: number | null = null;
      if (discountType !== "none" && discountValue && cleanPrice > 0) {
        const discVal = parseFloat(String(discountValue).replace(/[^0-9.]/g, "")) || 0;
        if (discountType === "percentage") {
          computedDiscountPrice = Math.max(0, cleanPrice - (cleanPrice * discVal / 100));
        } else if (discountType === "nominal") {
          computedDiscountPrice = Math.max(0, cleanPrice - discVal);
        }
      }

      let dimHeader = "";
      if (fabricLength.trim()) {
        const formattedLength = formatCmToMeterAndCm(fabricLength.trim());
        dimHeader += `Panjang Kain : ${formattedLength}\n`;
      }
      if (fabricWidth.trim()) {
        const formattedWidth = formatCmToMeterAndCm(fabricWidth.trim());
        dimHeader += `Lebar Kain : ${formattedWidth}\n`;
      }

      let parts: string[] = [];
      if (dimHeader.trim()) parts.push(dimHeader.trim());
      if (fabricInfo.trim()) parts.push(`INFORMASI KAIN:\n${fabricInfo.trim()}`);
      if (formData.description.trim()) parts.push(`DESKRIPSI PRODUK:\n${formData.description.trim()}`);

      const finalDescription = parts.join("\n\n").trim();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          code: formData.code?.trim().toUpperCase() || null,
          description: finalDescription,
          image: mainImageUrl || "/images/brukat_tile_mutiara.png",
          galleryImages: newGalleryUrls,
          colors: activeColors,
          colorStocks: Object.keys(payloadColorStocks).length > 0 ? payloadColorStocks : undefined,
          colorImages: Object.keys(payloadColorImages).length > 0 ? payloadColorImages : undefined,
          price: cleanPrice,
          discountPrice: computedDiscountPrice,
          sizeGuide: sizeGuideUrl || null,
          stock: cleanStock,
        }),
      });

      if (res.ok) {
        toast.success("Produk berhasil disimpan!");
        router.push("/admin/products");
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          toast.error("Sesi admin berakhir atau belum login. Silakan login kembali ke admin.");
        } else {
          toast.error(errorData.error || errorData.message || `Gagal menyimpan produk (Status ${res.status})`);
        }
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error?.message || "Terjadi kesalahan koneksi saat menyimpan produk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700">Nama Produk</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Panel Brukat Chantilly Premium"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 flex items-center justify-between">
            <span>Kode Kain</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Contoh: 3947AR, 4224"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm font-mono uppercase tracking-wider font-bold text-stone-900 bg-stone-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            list="category-suggestions"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            placeholder="Kategori Kain"
          />
        </div>
      </div>
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
      </datalist>

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

      {/* Gallery Images Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-gray-700">Gallery Images (Optional)</label>
          <span className="text-xs text-stone-500 font-semibold">
            Total Foto Galeri: {formData.galleryImages.length + galleryFiles.length}
          </span>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50/80 transition-colors bg-stone-50/50">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const newFiles = Array.from(e.target.files);
                setGalleryFiles((prev) => [...prev, ...newFiles]);
                toast.success(`${newFiles.length} foto galeri ditambahkan`);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white hover:file:bg-[#965e04] cursor-pointer"
          />
          <p className="mt-2.5 text-xs text-gray-500">
            <strong>Rekomendasi Galeri:</strong> Pilih satu atau beberapa gambar sekaligus. Orientasi Kotak (1:1), minimal 1080x1080px.
          </p>
        </div>

        {/* Gallery Preview Grid with Add & Remove Capabilities */}
        {(formData.galleryImages.length > 0 || galleryFiles.length > 0) && (
          <div className="mt-4">
            <p className="text-xs font-bold text-stone-600 mb-2.5">Gallery Preview (Klik tombol sampah untuk menghapus foto):</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {/* Existing Database Gallery Images */}
              {formData.galleryImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-stone-200 shadow-xs h-28 bg-stone-100">
                  <img
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Remove Existing Photo Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.galleryImages.filter((_, i) => i !== idx);
                      setFormData({ ...formData, galleryImages: updated });
                      toast.success("Foto galeri dihapus");
                    }}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-md transition-all opacity-90 group-hover:opacity-100"
                    title="Hapus foto ini dari galeri"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    # {idx + 1}
                  </span>
                </div>
              ))}

              {/* Newly Uploaded Gallery Files */}
              {galleryFiles.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-amber-300 ring-2 ring-amber-400/30 shadow-xs h-28 bg-stone-100">
                    <img
                      src={objectUrl}
                      alt={`New Gallery ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Remove New File Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
                        toast.success("File baru dibatalkan");
                      }}
                      className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-md transition-all opacity-90 group-hover:opacity-100"
                      title="Hapus file foto baru ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Baru
                    </span>
                  </div>
                );
              })}

              {/* Add More Photos Card Button */}
              <label className="h-28 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#b77305] flex flex-col items-center justify-center cursor-pointer bg-stone-50 hover:bg-stone-100/80 transition-colors text-stone-600">
                <Plus className="w-5 h-5 text-[#b77305] mb-1" />
                <span className="text-[10px] font-bold text-stone-700">+ Tambah</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      setGalleryFiles((prev) => [...prev, ...newFiles]);
                      toast.success(`${newFiles.length} foto ditambahkan`);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Fabric Dimensions (Panjang & Lebar Kain in cm) */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">Spesifikasi Ukuran Kain (Input dalam Satuan cm)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50/80 rounded-xl border border-stone-200/80">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Panjang Kain (cm)</label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                step="any"
                value={fabricLength}
                onChange={(e) => setFabricLength(e.target.value)}
                placeholder="Contoh: 250"
                className="w-full border border-stone-300 rounded-lg py-2 pl-3 pr-12 text-sm font-semibold focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] bg-white"
              />
              <span className="absolute right-3 text-xs font-bold text-stone-400 pointer-events-none">cm</span>
            </div>
            {fabricLength && !isNaN(parseFloat(fabricLength)) && (
              <p className="mt-1.5 text-[11px] font-bold text-[#b77305]">
                Format Tampil Web: {formatCmToMeterAndCm(fabricLength)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Lebar Kain (cm)</label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                step="any"
                value={fabricWidth}
                onChange={(e) => setFabricWidth(e.target.value)}
                placeholder="Contoh: 132"
                className="w-full border border-stone-300 rounded-lg py-2 pl-3 pr-12 text-sm font-semibold focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] bg-white"
              />
              <span className="absolute right-3 text-xs font-bold text-stone-400 pointer-events-none">cm</span>
            </div>
            {fabricWidth && !isNaN(parseFloat(fabricWidth)) && (
              <p className="mt-1.5 text-[11px] font-bold text-[#b77305]">
                Format Tampil Web: {formatCmToMeterAndCm(fabricWidth)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fabric Info / Specifications */}
      <div>
        <label className="block text-sm font-bold text-gray-700">Informasi Kain / Detail & Keunggulan Bahan (Optional)</label>
        <textarea
          rows={3}
          value={fabricInfo}
          onChange={(e) => setFabricInfo(e.target.value)}
          placeholder="Contoh: Serat renda dan brukat kualitas impor yang sangat halus, ringan, adem, dan tidak gatal di kulit. Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul."
          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-xs py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] sm:text-sm font-medium text-stone-800"
        />
        <p className="mt-1 text-[11px] text-stone-500">
          Informasi keunggulan bahan kain ini akan ditampilkan secara eksklusif pada bagian Detail Produk pembeli.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700">Deskripsi Tambahan Produk (Optional)</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Tuliskan rincian deskripsi produk, rekomendasi pemakaian (kebaya, gaun pesta, dll.)..."
          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-xs py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] sm:text-sm font-medium text-stone-800"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-gray-900">Tabel Varian Warna & Foto Spesifik Per Warna</label>
          {formData.colors.length > 0 && (
            <span className="text-xs text-[#b77305] font-bold">
              Total Stok Produk: {formData.stock} pcs
            </span>
          )}
        </div>

        {formData.colors.length > 0 ? (
          <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-xs">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-100">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Warna / Variasi
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Foto Varian Warna
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Stok (Pcs)
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {formData.colors.map((color, index) => {
                  const previewUrl = colorImageFiles[color]
                    ? URL.createObjectURL(colorImageFiles[color])
                    : (colorImages[color] || (formData.image ? formData.image : ""));

                  return (
                    <tr key={index} className="hover:bg-stone-50/70 transition-colors">
                      {/* Color Name Input */}
                      <td className="px-4 py-3.5 align-middle">
                        <input
                          type="text"
                          placeholder="Contoh: Merah"
                          value={color}
                          onChange={(e) => {
                            const oldColor = color;
                            const newColor = e.target.value;
                            const newColors = [...formData.colors];
                            newColors[index] = newColor;

                            const nextStocks = { ...colorStocks };
                            if (oldColor && nextStocks[oldColor] !== undefined) {
                              nextStocks[newColor] = nextStocks[oldColor];
                              delete nextStocks[oldColor];
                            } else {
                              nextStocks[newColor] = "50";
                            }

                            const nextImgs = { ...colorImages };
                            if (oldColor && nextImgs[oldColor]) {
                              nextImgs[newColor] = nextImgs[oldColor];
                              delete nextImgs[oldColor];
                            }

                            const nextFiles = { ...colorImageFiles };
                            if (oldColor && nextFiles[oldColor]) {
                              nextFiles[newColor] = nextFiles[oldColor];
                              delete nextFiles[oldColor];
                            }

                            setFormData({ ...formData, colors: newColors });
                            setColorStocks(nextStocks);
                            setColorImages(nextImgs);
                            setColorImageFiles(nextFiles);
                          }}
                          className="w-full border border-stone-300 rounded-lg py-2 px-3 text-sm font-semibold focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305]"
                        />
                      </td>

                      {/* Color Photo Preview & Upload */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {previewUrl ? (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-300 group shadow-xs">
                              <img src={previewUrl} alt={color} className="w-full h-full object-cover" />
                              <label className="absolute inset-0 bg-black/70 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer p-1">
                                <span>Ganti</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setColorImageFiles((prev) => ({ ...prev, [color]: file }));
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-300 hover:border-[#b77305] flex flex-col items-center justify-center cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                              <Upload className="w-4 h-4 text-[#b77305]" />
                              <span className="text-[9px] font-bold text-stone-600 mt-0.5">+ Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setColorImageFiles((prev) => ({ ...prev, [color]: file }));
                                  }
                                }}
                              />
                            </label>
                          )}

                          {/* Quick pick from main & gallery images (including newly picked files) */}
                          <select
                            value={
                              colorImageFiles[color]
                                ? (colorImageFiles[color] === imageFile
                                  ? "FILE_MAIN"
                                  : galleryFiles.indexOf(colorImageFiles[color]) >= 0
                                    ? `FILE_GALLERY_${galleryFiles.indexOf(colorImageFiles[color])}`
                                    : "")
                                : (colorImages[color] || "")
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setColorImages((prev) => {
                                  const next = { ...prev };
                                  delete next[color];
                                  return next;
                                });
                                setColorImageFiles((prev) => {
                                  const next = { ...prev };
                                  delete next[color];
                                  return next;
                                });
                                return;
                              }

                              if (val === "FILE_MAIN" && imageFile) {
                                setColorImageFiles((prev) => ({ ...prev, [color]: imageFile }));
                                setColorImages((prev) => {
                                  const next = { ...prev };
                                  delete next[color];
                                  return next;
                                });
                              } else if (val.startsWith("FILE_GALLERY_")) {
                                const gIdx = parseInt(val.replace("FILE_GALLERY_", ""));
                                if (galleryFiles[gIdx]) {
                                  setColorImageFiles((prev) => ({ ...prev, [color]: galleryFiles[gIdx] }));
                                  setColorImages((prev) => {
                                    const next = { ...prev };
                                    delete next[color];
                                    return next;
                                  });
                                }
                              } else {
                                setColorImages((prev) => ({ ...prev, [color]: val }));
                                setColorImageFiles((prev) => {
                                  const next = { ...prev };
                                  delete next[color];
                                  return next;
                                });
                              }
                            }}
                            className="text-[10px] border border-stone-300 rounded px-1.5 py-1 text-stone-700 bg-white max-w-[120px] font-medium shadow-2xs"
                          >
                            <option value="">Pilih Galeri...</option>

                            {/* Main Image Options */}
                            {imageFile && <option value="FILE_MAIN">Gambar Utama (Baru)</option>}
                            {!imageFile && formData.image && <option value={formData.image}>Gambar Utama</option>}

                            {/* Existing Gallery Images */}
                            {formData.galleryImages.map((gUrl, gIdx) => (
                              <option key={`ext-${gIdx}`} value={gUrl}>Foto Galeri #{gIdx + 1}</option>
                            ))}

                            {/* Newly Picked Gallery Files */}
                            {galleryFiles.map((file, gIdx) => (
                              <option key={`new-${gIdx}`} value={`FILE_GALLERY_${gIdx}`}>
                                Foto Galeri Baru #{formData.galleryImages.length + gIdx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Color Stock Input */}
                      <td className="px-4 py-3.5 align-middle">
                        <input
                          type="number"
                          min="0"
                          placeholder="50"
                          value={colorStocks[color] !== undefined ? colorStocks[color] : "100"}
                          onChange={(e) => updateColorStock(color, e.target.value)}
                          className="w-28 border border-stone-300 rounded-lg py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305]"
                        />
                      </td>

                      {/* Remove Button */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-stone-300 rounded-xl bg-stone-50 text-stone-500 text-xs">
            Belum ada varian warna yang ditambahkan. Klik tombol di atas untuk menambah varian warna kain.
          </div>
        )}

        <button
          type="button"
          onClick={() => handleAddColor(`Warna Baru ${formData.colors.length + 1}`)}
          className="mt-3 text-xs font-bold text-[#b77305] border border-[#b77305] px-3.5 py-2 rounded-xl hover:bg-[#b77305] hover:text-white transition-colors"
        >
          + Tambah Baris Varian Warna
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Foto tiap varian warna akan ditampilkan langsung di pilihan warna web pembeli dan mengubah foto utama saat diklik.
        </p>
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
