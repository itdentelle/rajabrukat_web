"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("bg-zinc-900");
  const [isActive, setIsActive] = useState(true);
  
  const [imageOption, setImageOption] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/collections/${unwrappedParams.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setDescription(data.description || "");
        setColor(data.color || "bg-zinc-900");
        setIsActive(data.isActive ?? true);
        setImageUrl(data.imageUrl || "");
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load collection details");
      })
      .finally(() => setFetching(false));
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageOption === "upload" && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `collection_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/collections/${unwrappedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title, subtitle, description, imageUrl: finalImageUrl, color, isActive
        })
      });

      if (!res.ok) throw new Error("Failed to update collection");

      toast.success("Collection updated successfully!");
      router.push("/admin/collections");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update collection");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">Edit Collection</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fall/Winter 2026" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. The Urban Uniform" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Color Theme (Tailwind Class)</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. bg-zinc-900" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            <p className="text-xs text-gray-500 mt-1">Used for the background overlay on the collections page.</p>
          </div>

          <div className="flex items-center pt-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 accent-black" />
              <span className="font-bold">Active (Visible to public)</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Collection Cover Image</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="imageOption" checked={imageOption === "url"} onChange={() => setImageOption("url")} className="accent-black" />
              <span className="text-sm font-medium">Use Image URL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="imageOption" checked={imageOption === "upload"} onChange={() => setImageOption("upload")} className="accent-black" />
              <span className="text-sm font-medium">Upload from Computer</span>
            </label>
          </div>

          {imageOption === "url" ? (
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required={imageOption === "url"} />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white" required={imageOption === "upload"} />
              <p className="mt-3 text-xs text-gray-500">
                <strong>Rekomendasi Gambar:</strong> Gunakan gambar orientasi Lanskap atau Kotak, minimal resolusi <strong>1080x1080px</strong>. Format JPG/PNG/WEBP, maksimal ukuran 2MB. Gambar ini akan memenuhi layar sebagai latar belakang koleksi.
              </p>
            </div>
          )}
          {imageUrl && imageOption === "url" && (
            <div className="mt-4 w-32 h-32 border overflow-hidden rounded">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={() => router.push("/admin/collections")} className="px-6 py-3 font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="bg-black text-white px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
