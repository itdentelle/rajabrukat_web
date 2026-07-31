"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function CMSSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Hero Banner
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [imageOption, setImageOption] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Shop Page
  const [shopTitle, setShopTitle] = useState("");
  const [shopDescription, setShopDescription] = useState("");

  // About Page
  const [aboutPageTitle, setAboutPageTitle] = useState("");
  const [aboutPageStory1, setAboutPageStory1] = useState("");
  const [aboutPageStory2, setAboutPageStory2] = useState("");
  const [aboutPageImgUrl, setAboutPageImgUrl] = useState("");
  const [aboutPageImgText, setAboutPageImgText] = useState("");
  const [aboutPagePhil1Title, setAboutPagePhil1Title] = useState("");
  const [aboutPagePhil1Desc, setAboutPagePhil1Desc] = useState("");
  const [aboutPagePhil2Title, setAboutPagePhil2Title] = useState("");
  const [aboutPagePhil2Desc, setAboutPagePhil2Desc] = useState("");
  const [aboutPagePhil3Title, setAboutPagePhil3Title] = useState("");
  const [aboutPagePhil3Desc, setAboutPagePhil3Desc] = useState("");

  // Footer
  const [footerDesc, setFooterDesc] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/config/hero")
      .then(res => res.json())
      .then(data => {
        if (data) {
          // Hero
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
          setButtonText(data.buttonText || "");
          setButtonLink(data.buttonLink || "");
          setImageUrl(data.imageUrl || "");
          
          // Shop
          setShopTitle(data.shopTitle || "");
          setShopDescription(data.shopDescription || "");

          // About Page
          setAboutPageTitle(data.aboutPageTitle || "");
          setAboutPageStory1(data.aboutPageStory1 || "");
          setAboutPageStory2(data.aboutPageStory2 || "");
          setAboutPageImgUrl(data.aboutPageImgUrl || "");
          setAboutPageImgText(data.aboutPageImgText || "");
          setAboutPagePhil1Title(data.aboutPagePhil1Title || "");
          setAboutPagePhil1Desc(data.aboutPagePhil1Desc || "");
          setAboutPagePhil2Title(data.aboutPagePhil2Title || "");
          setAboutPagePhil2Desc(data.aboutPagePhil2Desc || "");
          setAboutPagePhil3Title(data.aboutPagePhil3Title || "");
          setAboutPagePhil3Desc(data.aboutPagePhil3Desc || "");
          
          // Footer
          setFooterDesc(data.footerDesc || "");
          setInstagramUrl(data.instagramUrl || "");
          setFacebookUrl(data.facebookUrl || "");
          setTwitterUrl(data.twitterUrl || "");
        }
        setFetching(false);
      })
      .catch(err => {
        console.error("Failed to fetch config", err);
        toast.error("Failed to load current settings");
        setFetching(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // Handle file upload for Hero Banner
      if (imageOption === "upload" && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `banner_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // Save to database
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/config/hero", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title, subtitle, buttonText, buttonLink, imageUrl: finalImageUrl,
          shopTitle, shopDescription,
          aboutPageTitle, aboutPageStory1, aboutPageStory2, aboutPageImgUrl, aboutPageImgText,
          aboutPagePhil1Title, aboutPagePhil1Desc, aboutPagePhil2Title, aboutPagePhil2Desc, aboutPagePhil3Title, aboutPagePhil3Desc,
          footerDesc, instagramUrl, facebookUrl, twitterUrl
        })
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Site configuration updated successfully!");
      if (imageOption === "upload") {
        setImageUrl(finalImageUrl);
        setImageFile(null);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 font-bold text-gray-500 uppercase tracking-widest">Loading Settings...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Site Configuration (CMS)</h1>
        <p className="text-gray-500">Manage your website's content dynamically.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION: HERO BANNER */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Hero Banner (Homepage)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Main Title (Use \n for new line)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Button Text</label>
              <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Button Link</label>
              <input type="text" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Background Image</h3>
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
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800" required={imageOption === "upload"} />
                <p className="mt-3 text-xs text-gray-500">
                  <strong>Rekomendasi Gambar:</strong> Gunakan gambar orientasi Lanskap (Mendatar) minimal resolusi <strong>1920x1080px</strong>. Format JPG, PNG, atau WEBP. Maksimal ukuran 2MB agar website tetap cepat.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: SHOP PAGE */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Shop Page</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Shop Title (Use \n for new line)</label>
              <input type="text" value={shopTitle} onChange={(e) => setShopTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Shop Description</label>
              <textarea value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
          </div>
        </div>

        {/* SECTION: ABOUT PAGE */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">About Page</h2>
          
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Page Title (Use \n for new line)</label>
              <input type="text" value={aboutPageTitle} onChange={(e) => setAboutPageTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Story Paragraph 1</label>
              <textarea value={aboutPageStory1} onChange={(e) => setAboutPageStory1(e.target.value)} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Story Paragraph 2</label>
              <textarea value={aboutPageStory2} onChange={(e) => setAboutPageStory2(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mid-Page Image URL</label>
                <input type="url" value={aboutPageImgUrl} onChange={(e) => setAboutPageImgUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mid-Page Image Overlay Text</label>
                <input type="text" value={aboutPageImgText} onChange={(e) => setAboutPageImgText(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
              </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Philosophy Section (Bottom)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 1 Title</label>
              <input type="text" value={aboutPagePhil1Title} onChange={(e) => setAboutPagePhil1Title(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black mb-2" required />
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 1 Desc</label>
              <textarea value={aboutPagePhil1Desc} onChange={(e) => setAboutPagePhil1Desc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 2 Title</label>
              <input type="text" value={aboutPagePhil2Title} onChange={(e) => setAboutPagePhil2Title(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black mb-2" required />
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 2 Desc</label>
              <textarea value={aboutPagePhil2Desc} onChange={(e) => setAboutPagePhil2Desc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 3 Title</label>
              <input type="text" value={aboutPagePhil3Title} onChange={(e) => setAboutPagePhil3Title(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black mb-2" required />
              <label className="block text-sm font-bold text-gray-700 mb-2">Item 3 Desc</label>
              <textarea value={aboutPagePhil3Desc} onChange={(e) => setAboutPagePhil3Desc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
          </div>
        </div>

        {/* SECTION: FOOTER */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Footer Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Brand Description</label>
              <textarea value={footerDesc} onChange={(e) => setFooterDesc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Instagram URL</label>
              <input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Facebook URL</label>
              <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Twitter URL</label>
              <input type="text" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="bg-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors w-full md:w-auto">
            {loading ? "Saving Changes..." : "Save All Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
