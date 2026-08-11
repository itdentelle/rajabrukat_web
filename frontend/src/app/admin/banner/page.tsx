"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";
import { Save, Image as ImageIcon, Layout, Store, Share2, Info, Sparkles, Gem, Award, ShieldCheck, Heart, Layers, BookOpen, Flame, Home, ShoppingBag, Globe, Eye, PhoneCall, HelpCircle, Plus, Trash2, Edit3, Check, X } from "lucide-react";

export default function CMSSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mainTab, setMainTab] = useState<"landing" | "shop" | "about" | "footer" | "contact" | "pages">("landing");
  const [activeBannerTab, setActiveBannerTab] = useState<1 | 2 | 3>(1);

  // 1. Hero Banner 1 (Brukat 3D)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [imageOption, setImageOption] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 1b. Hero Banner 2 (Chantilly)
  const [panel2Title, setPanel2Title] = useState("");
  const [panel2Subtitle, setPanel2Subtitle] = useState("");
  const [panel2ButtonText, setPanel2ButtonText] = useState("");
  const [panel2ButtonLink, setPanel2ButtonLink] = useState("");
  const [panel2ImageOption, setPanel2ImageOption] = useState<"url" | "upload">("url");
  const [panel2ImageUrl, setPanel2ImageUrl] = useState("");
  const [panel2ImageFile, setPanel2ImageFile] = useState<File | null>(null);

  // 1c. Hero Banner 3 (Metallic)
  const [panel3Title, setPanel3Title] = useState("");
  const [panel3Subtitle, setPanel3Subtitle] = useState("");
  const [panel3ButtonText, setPanel3ButtonText] = useState("");
  const [panel3ButtonLink, setPanel3ButtonLink] = useState("");
  const [panel3ImageOption, setPanel3ImageOption] = useState<"url" | "upload">("url");
  const [panel3ImageUrl, setPanel3ImageUrl] = useState("");
  const [panel3ImageFile, setPanel3ImageFile] = useState<File | null>(null);

  // 1d. Featured Highlight Section (Pancar Keanggunan Gayamu)
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [featuredSubtitle, setFeaturedSubtitle] = useState("");
  const [badge1Title, setBadge1Title] = useState("");
  const [badge1Subtitle, setBadge1Subtitle] = useState("");
  const [badge2Title, setBadge2Title] = useState("");
  const [badge2Subtitle, setBadge2Subtitle] = useState("");
  const [badge3Title, setBadge3Title] = useState("");
  const [badge3Subtitle, setBadge3Subtitle] = useState("");

  // 1e. 3 Cards Overlapping Highlight
  const [featuredCard1Title, setFeaturedCard1Title] = useState("");
  const [featuredCard1Desc, setFeaturedCard1Desc] = useState("");
  const [featuredCard1ImgOption, setFeaturedCard1ImgOption] = useState<"url" | "upload">("url");
  const [featuredCard1ImgUrl, setFeaturedCard1ImgUrl] = useState("");
  const [featuredCard1ImgFile, setFeaturedCard1ImgFile] = useState<File | null>(null);
  const [featuredCard1Link, setFeaturedCard1Link] = useState("");

  const [featuredCard2Title, setFeaturedCard2Title] = useState("");
  const [featuredCard2Desc, setFeaturedCard2Desc] = useState("");
  const [featuredCard2ImgOption, setFeaturedCard2ImgOption] = useState<"url" | "upload">("url");
  const [featuredCard2ImgUrl, setFeaturedCard2ImgUrl] = useState("");
  const [featuredCard2ImgFile, setFeaturedCard2ImgFile] = useState<File | null>(null);
  const [featuredCard2Link, setFeaturedCard2Link] = useState("");

  const [featuredCard3Title, setFeaturedCard3Title] = useState("");
  const [featuredCard3Desc, setFeaturedCard3Desc] = useState("");
  const [featuredCard3ImgOption, setFeaturedCard3ImgOption] = useState<"url" | "upload">("url");
  const [featuredCard3ImgUrl, setFeaturedCard3ImgUrl] = useState("");
  const [featuredCard3ImgFile, setFeaturedCard3ImgFile] = useState<File | null>(null);
  const [featuredCard3Link, setFeaturedCard3Link] = useState("");

  // 2. Landing Page About Section
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutTitleLine1, setAboutTitleLine1] = useState("");
  const [aboutTitleLine2, setAboutTitleLine2] = useState("");
  const [aboutSubtitle, setAboutSubtitle] = useState("");
  const [aboutDescription, setAboutDescription] = useState("");

  // 3. Shop Page Header
  const [shopTitle, setShopTitle] = useState("");
  const [shopDescription, setShopDescription] = useState("");

  // 4. About Page Full (/about)
  const [aboutPageTitle, setAboutPageTitle] = useState("");
  const [aboutPageStory1, setAboutPageStory1] = useState("");
  const [aboutPageStory2, setAboutPageStory2] = useState("");
  const [aboutPageImgOption, setAboutPageImgOption] = useState<"url" | "upload">("url");
  const [aboutPageImgUrl, setAboutPageImgUrl] = useState("");
  const [aboutPageImgFile, setAboutPageImgFile] = useState<File | null>(null);
  const [aboutPageImgText, setAboutPageImgText] = useState("");
  const [aboutPageImgSubtext, setAboutPageImgSubtext] = useState("");
  // 5. Contact Page
  const [contactHeroTitle, setContactHeroTitle] = useState("");
  const [contactHeroSubtitle, setContactHeroSubtitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactHours, setContactHours] = useState("");

  // 6. FAQ & Returns Page
  const [faqPageTitle, setFaqPageTitle] = useState("");
  const [faqPageSubtitle, setFaqPageSubtitle] = useState("");
  const [returnsPageTitle, setReturnsPageTitle] = useState("");
  const [returnsPageSubtitle, setReturnsPageSubtitle] = useState("");
  const [returnsSection1Title, setReturnsSection1Title] = useState("");
  const [returnsSection1Desc, setReturnsSection1Desc] = useState("");
  const [returnsSection2Title, setReturnsSection2Title] = useState("");
  const [returnsSection2Desc, setReturnsSection2Desc] = useState("");
  const [returnsSection3Title, setReturnsSection3Title] = useState("");
  const [returnsSection3Desc, setReturnsSection3Desc] = useState("");

  // FAQ CRUD Manager
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqFormCategory, setFaqFormCategory] = useState("Pemesanan & Ukuran");
  const [faqFormQuestion, setFaqFormQuestion] = useState("");
  const [faqFormAnswer, setFaqFormAnswer] = useState("");
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);

  // Dynamic Category Banners Manager
  const [categoryBanners, setCategoryBanners] = useState<any[]>([
    {
      id: "grade-a",
      slug: "grade-a",
      tagline: "Koleksi Super Premium",
      title: "KATEGORI GRADE A",
      description: "Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.",
      image: "/images/brukat_tile_mutiara.png",
      imgOption: "url",
      imgFile: null,
    },
    {
      id: "grade-b",
      slug: "grade-b",
      tagline: "Koleksi Pilihan Ekonomis & Elegan",
      title: "KATEGORI GRADE B",
      description: "Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.",
      image: "/images/renda_chantilly_french.png",
      imgOption: "url",
      imgFile: null,
    },
    {
      id: "tulle",
      slug: "tulle",
      tagline: "Tile Jaring & Furing Silk Modern",
      title: "KATEGORI TULLE",
      description: "Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.",
      image: "/images/cornely_silk_satin.png",
      imgOption: "url",
      imgFile: null,
    },
  ]);

  const handleAddCategoryBanner = () => {
    const nextIdx = categoryBanners.length + 1;
    const newSlug = `kategori-${nextIdx}`;
    setCategoryBanners((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        slug: newSlug,
        tagline: "Koleksi Eksklusif Baru",
        title: `KATEGORI ${newSlug.toUpperCase()}`,
        description: "Deskripsi penjelasan kain untuk kategori ini...",
        image: "/images/brukat_tile_mutiara.png",
        imgOption: "url",
        imgFile: null,
      },
    ]);
    toast.success("Banner Kategori baru ditambahkan!");
  };

  const handleDeleteCategoryBanner = (id: string) => {
    if (categoryBanners.length <= 1) {
      toast.error("Minimal harus ada 1 banner kategori!");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus banner kategori ini?")) return;
    setCategoryBanners((prev) => prev.filter((cat) => cat.id !== id));
    toast.success("Banner Kategori berhasil dihapus!");
  };

  const handleUpdateCategoryBanner = (id: string, field: string, value: any) => {
    setCategoryBanners((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat))
    );
  };

  const [aboutPagePhil1Title, setAboutPagePhil1Title] = useState("");
  const [aboutPagePhil1Desc, setAboutPagePhil1Desc] = useState("");
  const [aboutPagePhil2Title, setAboutPagePhil2Title] = useState("");
  const [aboutPagePhil2Desc, setAboutPagePhil2Desc] = useState("");
  const [aboutPagePhil3Title, setAboutPagePhil3Title] = useState("");
  const [aboutPagePhil3Desc, setAboutPagePhil3Desc] = useState("");

  // 5. Footer & Socials
  const [footerDesc, setFooterDesc] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  // 6. Catalog PDF
  const [catalogPdfOption, setCatalogPdfOption] = useState<"url" | "upload">("url");
  const [catalogPdfUrl, setCatalogPdfUrl] = useState("");
  const [catalogPdfFile, setCatalogPdfFile] = useState<File | null>(null);
  const [catalogTitleLine1, setCatalogTitleLine1] = useState("");
  const [catalogTitleLine2, setCatalogTitleLine2] = useState("");

  // 4. Tentang Brand Section Swatches
  const [aboutCircle1ProductId, setAboutCircle1ProductId] = useState("");
  const [aboutCircle2ProductId, setAboutCircle2ProductId] = useState("");
  const [aboutCircle3ProductId, setAboutCircle3ProductId] = useState("");
  const [aboutCircle4ProductId, setAboutCircle4ProductId] = useState("");
  const [aboutCircle5ProductId, setAboutCircle5ProductId] = useState("");

  // 5. Latest Drops Section
  const [latestBadge, setLatestBadge] = useState("");
  const [latestTitleLine1, setLatestTitleLine1] = useState("");
  const [latestTitleLine2, setLatestTitleLine2] = useState("");
  const [latestDesc, setLatestDesc] = useState("");
  const [dealsBadge, setDealsBadge] = useState("");
  const [dealsTitle, setDealsTitle] = useState("");
  const [dealsDescription, setDealsDescription] = useState("");
  const [dealsProductId, setDealsProductId] = useState("");
  const [dealsEndsAt, setDealsEndsAt] = useState("");
  const [dealsDiscountPrice, setDealsDiscountPrice] = useState("");
  const [dealsPoint1, setDealsPoint1] = useState("");
  const [dealsPoint2, setDealsPoint2] = useState("");
  const [dealsPoint3, setDealsPoint3] = useState("");

  // 2.4 Lookbook Section
  const [lookbookBadge, setLookbookBadge] = useState("");
  const [lookbookTitleLine1, setLookbookTitleLine1] = useState("");
  const [lookbookTitleLine2, setLookbookTitleLine2] = useState("");
  const [lookbookDesc, setLookbookDesc] = useState("");
  const [lookbookCard1ProductId, setLookbookCard1ProductId] = useState("");
  const [lookbookCard2ProductId, setLookbookCard2ProductId] = useState("");
  const [lookbookCard3ProductId, setLookbookCard3ProductId] = useState("");
  const [lookbookCard4ProductId, setLookbookCard4ProductId] = useState("");
  const [lookbookCard1Tag, setLookbookCard1Tag] = useState("");
  const [lookbookCard2Tag, setLookbookCard2Tag] = useState("");
  const [lookbookCard3Tag, setLookbookCard3Tag] = useState("");
  const [lookbookCard4Tag, setLookbookCard4Tag] = useState("");

  // 2.5 Compare Section
  const [compareTitle, setCompareTitle] = useState("");
  const [compareBeforeLabel, setCompareBeforeLabel] = useState("");
  const [compareAfterLabel, setCompareAfterLabel] = useState("");
  const [compareBeforeImage, setCompareBeforeImage] = useState("");
  const [compareBeforeImgOption, setCompareBeforeImgOption] = useState<"url" | "upload">("url");
  const [compareBeforeImgFile, setCompareBeforeImgFile] = useState<File | null>(null);
  const [compareAfterImage, setCompareAfterImage] = useState("");
  const [compareAfterImgOption, setCompareAfterImgOption] = useState<"url" | "upload">("url");
  const [compareAfterImgFile, setCompareAfterImgFile] = useState<File | null>(null);

  // Best Sellers Section
  const [bestSellersTitle, setBestSellersTitle] = useState("");
  const [bestSellersDescription, setBestSellersDescription] = useState("");

  // Category Headers (/collections/*)
  const [gradeATagline, setGradeATagline] = useState("");
  const [gradeATitle, setGradeATitle] = useState("");
  const [gradeADesc, setGradeADesc] = useState("");
  const [gradeAImage, setGradeAImage] = useState("");
  const [gradeAImgOption, setGradeAImgOption] = useState<"url" | "upload">("url");
  const [gradeAImgFile, setGradeAImgFile] = useState<File | null>(null);

  const [gradeBTagline, setGradeBTagline] = useState("");
  const [gradeBTitle, setGradeBTitle] = useState("");
  const [gradeBDesc, setGradeBDesc] = useState("");
  const [gradeBImage, setGradeBImage] = useState("");
  const [gradeBImgOption, setGradeBImgOption] = useState<"url" | "upload">("url");
  const [gradeBImgFile, setGradeBImgFile] = useState<File | null>(null);

  const [tulleTagline, setTulleTagline] = useState("");
  const [tulleTitle, setTulleTitle] = useState("");
  const [tulleDesc, setTulleDesc] = useState("");
  const [tulleImage, setTulleImage] = useState("");
  const [tulleImgOption, setTulleImgOption] = useState<"url" | "upload">("url");
  const [tulleImgFile, setTulleImgFile] = useState<File | null>(null);

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Products for Deals Dropdown
    fetch(`${API_BASE_URL}/api/products?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.products) setProducts(data.products);
        else if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch Site Config
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          // Banner 1
          setTitle(data.title || "Keanggunan Kain Semi Prancis 3D Premium");
          setSubtitle(data.subtitle || "KOLEKSI RAJA BRUKAT 2026");
          setButtonText(data.buttonText || "Shop Now");
          setButtonLink(data.buttonLink || "/shop");
          setImageUrl(data.imageUrl || "/images/white_lace_hero.png");

          // Banner 2
          setPanel2Title(data.panel2Title || "Panel Brukat Chantily");
          setPanel2Subtitle(data.panel2Subtitle || "RENDA CHANTILLY FRENCH");
          setPanel2ButtonText(data.panel2ButtonText || "Lihat Koleksi");
          setPanel2ButtonLink(data.panel2ButtonLink || "/shop?category=Renda Chantilly");
          setPanel2ImageUrl(data.panel2ImageUrl || "/images/beige_lace_hero.png");

          // Banner 3
          setPanel3Title(data.panel3Title || "Panel Metallic Ellegant");
          setPanel3Subtitle(data.panel3Subtitle || "METALLIC LACE ELEGANT");
          setPanel3ButtonText(data.panel3ButtonText || "Lihat Koleksi");
          setPanel3ButtonLink(data.panel3ButtonLink || "/shop?category=Metallic");
          setPanel3ImageUrl(data.panel3ImageUrl || "/images/metallic_lace_hero.png");

          // Featured Highlight Section
          setFeaturedTitle(data.featuredTitle || "Pancar \\n Keanggunan \\n Gayamu.");
          setFeaturedSubtitle(data.featuredSubtitle || "Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.");
          setBadge1Title(data.badge1Title || "Garansi Retur");
          setBadge1Subtitle(data.badge1Subtitle || "Kemudahan Tukar");
          setBadge2Title(data.badge2Title || "100% Premium");
          setBadge2Subtitle(data.badge2Subtitle || "Serat Halus Impor");
          setBadge3Title(data.badge3Title || "Bebas Ongkir");
          setBadge3Subtitle(data.badge3Subtitle || "Pengiriman Cepat");

          // Featured 3 Cards
          setFeaturedCard1Title(data.featuredCard1Title || "Panel Brukat Polos Busana Pesta");
          setFeaturedCard1Desc(data.featuredCard1Desc || "Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.");
          setFeaturedCard1ImgUrl(data.featuredCard1ImgUrl || "/images/renda_chantilly_french.png");
          setFeaturedCard1Link(data.featuredCard1Link || "/shop?category=Panel Brukat Polos");

          setFeaturedCard2Title(data.featuredCard2Title || "Panel Full Metalic");
          setFeaturedCard2Desc(data.featuredCard2Desc || "Kondisi baru, memakai benang metalik yang menambah kesan elegan. Bahan adem dan nyaman dipakai. Foto-foto warna sudah sesuai dengan kondisi aslinya.");
          setFeaturedCard2ImgUrl(data.featuredCard2ImgUrl || "/images/brukat_tile_mutiara.png");
          setFeaturedCard2Link(data.featuredCard2Link || "/shop?category=Panel Full Metalic");

          setFeaturedCard3Title(data.featuredCard3Title || "Panel Renda Chantilly Impor");
          setFeaturedCard3Desc(data.featuredCard3Desc || "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.");
          setFeaturedCard3ImgUrl(data.featuredCard3ImgUrl || "/images/cornely_silk_satin.png");
          setFeaturedCard3Link(data.featuredCard3Link || "/shop?category=Renda Chantilly");

          // Landing About Section
          setAboutTitle(data.aboutTitle || "Didedikasikan Untuk Keindahan Kebaya & Gaun Mewah");
          setAboutTitleLine1(data.aboutTitleLine1 || (data.aboutTitle ? data.aboutTitle.split('\n')[0] : "Didedikasikan Untuk"));
          setAboutTitleLine2(data.aboutTitleLine2 || (data.aboutTitle ? data.aboutTitle.split('\n')[1] || "" : "Keindahan Kebaya & Gaun Mewah"));
          setAboutSubtitle(data.aboutSubtitle || "Koleksi Tekstil Eksklusif");
          setAboutDescription(data.aboutDescription || "Pusat grosir dan eceran kain brukat bermutu tinggi di Indonesia.");
          setAboutCircle1ProductId(data.aboutCircle1ProductId || "");
          setAboutCircle2ProductId(data.aboutCircle2ProductId || "");
          setAboutCircle3ProductId(data.aboutCircle3ProductId || "");
          setAboutCircle4ProductId(data.aboutCircle4ProductId || "");
          setAboutCircle5ProductId(data.aboutCircle5ProductId || "");

          // Latest Drops Section
          setLatestBadge(data.latestBadge || "KOLEKSI MOTIF TERBARU");
          setLatestTitleLine1(data.latestTitleLine1 || "Rilis Koleksi Kain");
          setLatestTitleLine2(data.latestTitleLine2 || "Terbaru & Eksklusif");
          setLatestDesc(data.latestDesc || "Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.");
          setShopTitle(data.shopTitle || "Katalog Kain Brukat & Renda Premium");
          setShopDescription(data.shopDescription || "Temukan koleksi motif brukat mutiara, renda chantilly, dan cornely 3D terbaik untuk gaun dan kebaya Anda.");
          setCatalogPdfUrl(data.catalogPdfUrl || "/Katalog.pdf");
          setCatalogTitleLine1(data.catalogTitleLine1 || "Katalog");
          setCatalogTitleLine2(data.catalogTitleLine2 || "Kain Eksklusif");

          // About Page Full
          setAboutPageTitle(data.aboutPageTitle || "Keanggunan Tekstil Kebaya \\n Mewah & Eksklusif Raja Brukat");
          setAboutPageStory1(data.aboutPageStory1 || "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.");
          setAboutPageStory2(data.aboutPageStory2 || "Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan ratusan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta modern, seragam keluarga bridesmaid, hingga busana pengantin akad & resepsi.\\n\\nSetiap roll kain dikurasi secara teliti dengan kerapatan bordir presisi, hiasan mutiara timbul 3D, serta tekstur lembut yang sangat nyaman dan dingin dipakai sepanjang hari.");
          setAboutPageImgUrl(data.aboutPageImgUrl || "/images/brukat_tile_mutiara.png");
          setAboutPageImgText(data.aboutPageImgText || "Kemewahan Tanpa Kompromi.");
          setAboutPageImgSubtext(data.aboutPageImgSubtext || "Perpaduan seni bordir presisi tinggi, taburan kristal bercahaya, serta kelembutan serat renda impor kualitas ekspor.");

          setAboutPagePhil1Title(data.aboutPagePhil1Title || "01. Kualitas Premium Impor");
          setAboutPagePhil1Desc(data.aboutPagePhil1Desc || "Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit, tahan lama, dingin, dan tidak gatal.");
          setAboutPagePhil2Title(data.aboutPagePhil2Title || "02. Motif Anggun & Mewah");
          setAboutPagePhil2Desc(data.aboutPagePhil2Desc || "Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang sangat mewah untuk segala momen istimewa.");
          setAboutPagePhil3Title(data.aboutPagePhil3Title || "03. Pelayanan Eceran & Grosir");
          setAboutPagePhil3Desc(data.aboutPagePhil3Desc || "Melayani pembelian eceran per meter maupun gulungan roll besar untuk desainer, penjahit, dan seragam acara.");

          // Contact Page
          setContactHeroTitle(data.contactHeroTitle || "Layanan & Konsultasi Kain Raja Brukat");
          setContactHeroSubtitle(data.contactHeroSubtitle || "HUBUNGI TIM CS KAMI");
          setContactPhone(data.contactPhone || "+62 858-8166-7778");
          setContactWhatsapp(data.contactWhatsapp || "6285881667778");
          setContactEmail(data.contactEmail || "info@rajabrukat.com");
          setContactAddress(data.contactAddress || "Pusat Tekstil Raja Brukat, Indonesia");
          setContactHours(data.contactHours || "Senin - Sabtu: 08:00 - 17:00 WIB");

          // FAQ & Returns Page
          setFaqPageTitle(data.faqPageTitle || "Pertanyaan Umum (FAQ)");
          setFaqPageSubtitle(data.faqPageSubtitle || "Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.");
          setReturnsPageTitle(data.returnsPageTitle || "Kebijakan Garansi & Retur Kain");
          setReturnsPageSubtitle(data.returnsPageSubtitle || "Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.");
          setReturnsSection1Title(data.returnsSection1Title || "1. Ketentuan Garansi & Syarat Retur");
          setReturnsSection1Desc(data.returnsSection1Desc || "Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.");
          setReturnsSection2Title(data.returnsSection2Title || "2. Syarat Wajib Video Unboxing");
          setReturnsSection2Desc(data.returnsSection2Desc || "Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.");
          setReturnsSection3Title(data.returnsSection3Title || "3. Tata Cara Mengajukan Retur");
          setReturnsSection3Desc(data.returnsSection3Desc || "1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur.");

          // Deals
          setDealsBadge(data.dealsBadge || "PROMO SPESIAL TERBATAS");
          setDealsTitle(data.dealsTitle || "Penawaran Tekstil Eksklusif");
          setDealsDescription(data.dealsDescription || "Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada.");
          setDealsProductId(data.dealsProductId || "");
          setDealsEndsAt(data.dealsEndsAt ? data.dealsEndsAt.slice(0, 16) : "");
          setDealsDiscountPrice(data.dealsDiscountPrice ? data.dealsDiscountPrice.toString() : "");
          setDealsPoint1(data.dealsPoint1 || "Motif bordir rapat dengan taburan payet mutiara timbul 3D");
          setDealsPoint2(data.dealsPoint2 || "Serat renda Chantilly & tile ekspor yang sangat halus di kulit");
          setDealsPoint3(data.dealsPoint3 || "Stok promo sangat terbatas (Sisa 15 Meter Terakhir)");

          // Lookbook
          setLookbookBadge(data.lookbookBadge || "INSPIRASI BUSANA KEBAYA & GAUN MEWAH");
          setLookbookTitleLine1(data.lookbookTitleLine1 || "Galeri Lookbook &");
          setLookbookTitleLine2(data.lookbookTitleLine2 || "Inspirasi Busana Kebaya");
          setLookbookDesc(data.lookbookDesc || "Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!");
          setLookbookCard1ProductId(data.lookbookCard1ProductId || "");
          setLookbookCard2ProductId(data.lookbookCard2ProductId || "");
          setLookbookCard3ProductId(data.lookbookCard3ProductId || "");
          setLookbookCard4ProductId(data.lookbookCard4ProductId || "");
          setLookbookCard1Tag(data.lookbookCard1Tag || "KEBAYA PENGANTIN");
          setLookbookCard2Tag(data.lookbookCard2Tag || "GAUN PESTA");
          setLookbookCard3Tag(data.lookbookCard3Tag || "SERAGAM BRIDESMAID");
          setLookbookCard4Tag(data.lookbookCard4Tag || "KEBAYA WISUDA");

          // Compare Section
          setCompareTitle(data.compareTitle || "Compare Textile Quality");
          setCompareBeforeLabel(data.compareBeforeLabel || "Semi Prancis 3D");
          setCompareAfterLabel(data.compareAfterLabel || "Metallic Elegant");
          setCompareBeforeImage(data.compareBeforeImage || "/images/white_lace_hero.png");
          setCompareAfterImage(data.compareAfterImage || "/images/metallic_lace_hero.png");

          // Best Sellers
          setBestSellersTitle(data.bestSellersTitle || "Best Sellers.");
          setBestSellersDescription(data.bestSellersDescription || "The pieces everyone is talking about. Grab them before they're gone.");

          // Category Collection Headers
          if (data.categoryBanners) {
            try {
              const parsed = typeof data.categoryBanners === "string" ? JSON.parse(data.categoryBanners) : data.categoryBanners;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCategoryBanners(
                  parsed.map((item: any) => ({
                    id: item.id || `cat-${Math.random().toString(36).substr(2, 9)}`,
                    slug: item.slug || "kategori",
                    tagline: item.tagline || "",
                    title: item.title || "",
                    description: item.description || "",
                    image: item.image || "/images/brukat_tile_mutiara.png",
                    imgOption: item.imgOption || "url",
                    imgFile: null,
                  }))
                );
              }
            } catch (e) {
              console.error("Failed parsing categoryBanners:", e);
            }
          } else if (data.gradeATitle || data.gradeBTitle || data.tulleTitle) {
            setCategoryBanners([
              {
                id: "grade-a",
                slug: "grade-a",
                tagline: data.gradeATagline || "Koleksi Super Premium",
                title: data.gradeATitle || "KATEGORI GRADE A",
                description: data.gradeADesc || "Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.",
                image: data.gradeAImage || "/images/brukat_tile_mutiara.png",
                imgOption: "url",
                imgFile: null,
              },
              {
                id: "grade-b",
                slug: "grade-b",
                tagline: data.gradeBTagline || "Koleksi Pilihan Ekonomis & Elegan",
                title: data.gradeBTitle || "KATEGORI GRADE B",
                description: data.gradeBDesc || "Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.",
                image: data.gradeBImage || "/images/renda_chantilly_french.png",
                imgOption: "url",
                imgFile: null,
              },
              {
                id: "tulle",
                slug: "tulle",
                tagline: data.tulleTagline || "Tile Jaring & Furing Silk Modern",
                title: data.tulleTitle || "KATEGORI TULLE",
                description: data.tulleDesc || "Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.",
                image: data.tulleImage || "/images/cornely_silk_satin.png",
                imgOption: "url",
                imgFile: null,
              },
            ]);
          }

          setGradeATagline(data.gradeATagline || "Koleksi Super Premium");
          setGradeATitle(data.gradeATitle || "KATEGORI GRADE A");
          setGradeADesc(data.gradeADesc || "Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.");
          setGradeAImage(data.gradeAImage || "/images/brukat_tile_mutiara.png");

          setGradeBTagline(data.gradeBTagline || "Koleksi Pilihan Ekonomis & Elegan");
          setGradeBTitle(data.gradeBTitle || "KATEGORI GRADE B");
          setGradeBDesc(data.gradeBDesc || "Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.");
          setGradeBImage(data.gradeBImage || "/images/renda_chantilly_french.png");

          setTulleTagline(data.tulleTagline || "Tile Jaring & Furing Silk Modern");
          setTulleTitle(data.tulleTitle || "KATEGORI TULLE");
          setTulleDesc(data.tulleDesc || "Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.");
          setTulleImage(data.tulleImage || "/images/cornely_silk_satin.png");

          // Footer
          setFooterDesc(data.footerDesc || "Raja Brukat – Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan tentunya dengan harga yang terjangkau.");
          setInstagramUrl(data.instagramUrl || "https://instagram.com/rajabrukat_id");
          setFacebookUrl(data.facebookUrl || "https://facebook.com/rajabrukat");
          setTiktokUrl(data.tiktokUrl || "https://tiktok.com/@rajabrukatofficial");
          setWhatsappUrl(data.whatsappUrl || "https://wa.me/6285881667778");
        }
        setFetching(false);
      })
      .catch((err) => {
        console.error("Failed to fetch config", err);
        toast.error("Gagal memuat konfigurasi CMS");
        setFetching(false);
      });

    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqItems(data);
      }
    } catch (e) {
      console.error("Error fetching FAQs:", e);
    }
  };

  const handleOpenNewFaq = () => {
    setEditingFaqId(null);
    setFaqFormCategory("Pemesanan & Ukuran");
    setFaqFormQuestion("");
    setFaqFormAnswer("");
    setIsFaqFormOpen(true);
  };

  const handleOpenEditFaq = (item: any) => {
    setEditingFaqId(item.id);
    setFaqFormCategory(item.category || "Pemesanan & Ukuran");
    setFaqFormQuestion(item.question || "");
    setFaqFormAnswer(item.answer || "");
    setIsFaqFormOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqFormQuestion || !faqFormAnswer) {
      toast.error("Pertanyaan dan Jawaban wajib diisi.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const isEditing = Boolean(editingFaqId);
      const url = isEditing ? `${API_BASE_URL}/api/faqs/${editingFaqId}` : `${API_BASE_URL}/api/faqs`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          category: faqFormCategory,
          question: faqFormQuestion,
          answer: faqFormAnswer
        })
      });

      if (!res.ok) throw new Error("Gagal menyimpan FAQ");

      toast.success(isEditing ? "FAQ berhasil diperbarui" : "FAQ baru berhasil ditambahkan");
      setIsFaqFormOpen(false);
      setEditingFaqId(null);
      setFaqFormQuestion("");
      setFaqFormAnswer("");
      fetchFaqs();
    } catch (err) {
      toast.error("Gagal menyimpan item FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item FAQ ini?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/faqs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Gagal menghapus FAQ");

      toast.success("FAQ berhasil dihapus");
      fetchFaqs();
    } catch (e) {
      toast.error("Gagal menghapus FAQ");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalHeroImageUrl = imageUrl;
      let finalPanel2ImageUrl = panel2ImageUrl;
      let finalPanel3ImageUrl = panel3ImageUrl;
      let finalAboutPageImgUrl = aboutPageImgUrl;

      // Handle Hero Image 1 Upload
      if (imageOption === "upload" && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `hero1_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalHeroImageUrl = publicUrlData.publicUrl;
      }

      // Handle Hero Image 2 Upload
      if (panel2ImageOption === "upload" && panel2ImageFile) {
        const fileExt = panel2ImageFile.name.split('.').pop();
        const fileName = `hero2_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, panel2ImageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalPanel2ImageUrl = publicUrlData.publicUrl;
      }

      // Handle Hero Image 3 Upload
      if (panel3ImageOption === "upload" && panel3ImageFile) {
        const fileExt = panel3ImageFile.name.split('.').pop();
        const fileName = `hero3_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, panel3ImageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalPanel3ImageUrl = publicUrlData.publicUrl;
      }

      let finalFeaturedCard1ImgUrl = featuredCard1ImgUrl;
      let finalFeaturedCard2ImgUrl = featuredCard2ImgUrl;
      let finalFeaturedCard3ImgUrl = featuredCard3ImgUrl;

      // Handle Featured Card 1 Image Upload
      if (featuredCard1ImgOption === "upload" && featuredCard1ImgFile) {
        const fileExt = featuredCard1ImgFile.name.split('.').pop();
        const fileName = `feat_card1_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, featuredCard1ImgFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalFeaturedCard1ImgUrl = publicUrlData.publicUrl;
      }

      // Handle Featured Card 2 Image Upload
      if (featuredCard2ImgOption === "upload" && featuredCard2ImgFile) {
        const fileExt = featuredCard2ImgFile.name.split('.').pop();
        const fileName = `feat_card2_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, featuredCard2ImgFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalFeaturedCard2ImgUrl = publicUrlData.publicUrl;
      }

      // Handle Featured Card 3 Image Upload
      if (featuredCard3ImgOption === "upload" && featuredCard3ImgFile) {
        const fileExt = featuredCard3ImgFile.name.split('.').pop();
        const fileName = `feat_card3_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, featuredCard3ImgFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalFeaturedCard3ImgUrl = publicUrlData.publicUrl;
      }

      // Handle About Page Image Upload
      if (aboutPageImgOption === "upload" && aboutPageImgFile) {
        const fileExt = aboutPageImgFile.name.split('.').pop();
        const fileName = `about_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, aboutPageImgFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalAboutPageImgUrl = publicUrlData.publicUrl;
      }

      let finalCatalogPdfUrl = catalogPdfUrl;
      if (catalogPdfOption === "upload" && catalogPdfFile) {
        const fileExt = catalogPdfFile.name.split('.').pop();
        const fileName = `catalog_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, catalogPdfFile, { upsert: true, contentType: "application/pdf" });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalCatalogPdfUrl = publicUrlData.publicUrl;
      }

      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      // Compare Images Upload
      let finalCompareBeforeImgUrl = compareBeforeImage;
      if (compareBeforeImgOption === "upload" && compareBeforeImgFile) {
        const fileExt = compareBeforeImgFile.name.split('.').pop();
        const fileName = `compare-before-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('products')
          .upload(fileName, compareBeforeImgFile);
        if (!uploadErr) {
          const { data: pubUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
          finalCompareBeforeImgUrl = pubUrlData.publicUrl;
        }
      }

      let finalCompareAfterImgUrl = compareAfterImage;
      if (compareAfterImgOption === "upload" && compareAfterImgFile) {
        const fileExt = compareAfterImgFile.name.split('.').pop();
        const fileName = `compare-after-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('products')
          .upload(fileName, compareAfterImgFile);
        if (!uploadErr) {
          const { data: pubUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
          finalCompareAfterImgUrl = pubUrlData.publicUrl;
        }
      }

      // Category Banners Upload
      let finalGradeAImgUrl = gradeAImage;
      if (gradeAImgOption === "upload" && gradeAImgFile) {
        const fileExt = gradeAImgFile.name.split('.').pop();
        const fileName = `cat-grade-a-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, gradeAImgFile);
        if (!uploadErr) {
          const { data: pubUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
          finalGradeAImgUrl = pubUrlData.publicUrl;
        }
      }

      let finalGradeBImgUrl = gradeBImage;
      if (gradeBImgOption === "upload" && gradeBImgFile) {
        const fileExt = gradeBImgFile.name.split('.').pop();
        const fileName = `cat-grade-b-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, gradeBImgFile);
        if (!uploadErr) {
          const { data: pubUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
          finalGradeBImgUrl = pubUrlData.publicUrl;
        }
      }

      let finalTulleImgUrl = tulleImage;
      if (tulleImgOption === "upload" && tulleImgFile) {
        const fileExt = tulleImgFile.name.split('.').pop();
        const fileName = `cat-tulle-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, tulleImgFile);
        if (!uploadErr) {
          const { data: pubUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
          finalTulleImgUrl = pubUrlData.publicUrl;
        }
      }

      const processedCategoryBanners = await Promise.all(
        categoryBanners.map(async (cat) => {
          let finalImg = cat.image;
          if (cat.imgOption === "upload" && cat.imgFile) {
            const fileExt = cat.imgFile.name.split(".").pop();
            const fileName = `cat-${cat.slug || Date.now()}-${Date.now()}.${fileExt}`;
            const { error: uploadErr } = await supabase.storage.from("products").upload(fileName, cat.imgFile);
            if (!uploadErr) {
              const { data: pubUrlData } = supabase.storage.from("products").getPublicUrl(fileName);
              finalImg = pubUrlData.publicUrl;
            }
          }
          return {
            id: cat.id,
            slug: cat.slug,
            tagline: cat.tagline,
            title: cat.title,
            description: cat.description,
            image: finalImg,
            imgOption: "url",
          };
        })
      );

      const res = await fetch(`${API_BASE_URL}/api/config/hero`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title, subtitle, buttonText, buttonLink, imageUrl: finalHeroImageUrl,
          panel2Title, panel2Subtitle, panel2ButtonText, panel2ButtonLink, panel2ImageUrl: finalPanel2ImageUrl,
          panel3Title, panel3Subtitle, panel3ButtonText, panel3ButtonLink, panel3ImageUrl: finalPanel3ImageUrl,
          featuredTitle, featuredSubtitle,
          badge1Title, badge1Subtitle, badge2Title, badge2Subtitle, badge3Title, badge3Subtitle,
          featuredCard1Title, featuredCard1Desc, featuredCard1ImgUrl: finalFeaturedCard1ImgUrl, featuredCard1Link,
          featuredCard2Title, featuredCard2Desc, featuredCard2ImgUrl: finalFeaturedCard2ImgUrl, featuredCard2Link,
          featuredCard3Title, featuredCard3Desc, featuredCard3ImgUrl: finalFeaturedCard3ImgUrl, featuredCard3Link,
          aboutTitle, aboutTitleLine1, aboutTitleLine2, aboutSubtitle, aboutDescription,
          aboutCircle1ProductId, aboutCircle2ProductId, aboutCircle3ProductId, aboutCircle4ProductId, aboutCircle5ProductId,
          latestBadge, latestTitleLine1, latestTitleLine2, latestDesc,
          shopTitle, shopDescription, catalogPdfUrl: finalCatalogPdfUrl, catalogTitleLine1, catalogTitleLine2,
          aboutPageTitle, aboutPageStory1, aboutPageStory2, aboutPageImgUrl: finalAboutPageImgUrl, aboutPageImgText, aboutPageImgSubtext,
          aboutPagePhil1Title, aboutPagePhil1Desc, aboutPagePhil2Title, aboutPagePhil2Desc, aboutPagePhil3Title, aboutPagePhil3Desc,
          contactHeroTitle, contactHeroSubtitle, contactPhone, contactWhatsapp, contactEmail, contactAddress, contactHours,
          faqPageTitle, faqPageSubtitle,
          returnsPageTitle, returnsPageSubtitle, returnsSection1Title, returnsSection1Desc, returnsSection2Title, returnsSection2Desc, returnsSection3Title, returnsSection3Desc,
          footerDesc, instagramUrl, facebookUrl, tiktokUrl, whatsappUrl,
          dealsBadge, dealsTitle, dealsDescription, dealsProductId, dealsEndsAt, dealsDiscountPrice,
          dealsPoint1, dealsPoint2, dealsPoint3,
          lookbookBadge, lookbookTitleLine1, lookbookTitleLine2, lookbookDesc,
          lookbookCard1ProductId, lookbookCard2ProductId, lookbookCard3ProductId, lookbookCard4ProductId,
          lookbookCard1Tag, lookbookCard2Tag, lookbookCard3Tag, lookbookCard4Tag,
          compareTitle, compareBeforeLabel, compareAfterLabel,
          compareBeforeImage: finalCompareBeforeImgUrl,
          compareAfterImage: finalCompareAfterImgUrl,
          bestSellersTitle, bestSellersDescription,
          categoryBanners: JSON.stringify(processedCategoryBanners),
          gradeATagline, gradeATitle, gradeADesc, gradeAImage: finalGradeAImgUrl,
          gradeBTagline, gradeBTitle, gradeBDesc, gradeBImage: finalGradeBImgUrl,
          tulleTagline, tulleTitle, tulleDesc, tulleImage: finalTulleImgUrl
        })
      });

      if (!res.ok) throw new Error("Gagal menyimpan konfigurasi");

      toast.success("Pengaturan 3 banner hero & site CMS berhasil disimpan!");
      if (imageOption === "upload") { setImageUrl(finalHeroImageUrl); setImageFile(null); }
      if (panel2ImageOption === "upload") { setPanel2ImageUrl(finalPanel2ImageUrl); setPanel2ImageFile(null); }
      if (panel3ImageOption === "upload") { setPanel3ImageUrl(finalPanel3ImageUrl); setPanel3ImageFile(null); }
      if (aboutPageImgOption === "upload") { setAboutPageImgUrl(finalAboutPageImgUrl); setAboutPageImgFile(null); }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm font-bold text-stone-500 uppercase tracking-widest animate-pulse">
        Memuat Konfigurasi Site CMS...
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900">
            Site Content Management (CMS)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Kelola ke-3 slide hero banner beranda, halaman tentang kami, deskripsi katalog, dan informasi footer toko secara real-time.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#b77305]/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* CMS Category Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-stone-100 p-2 rounded-2xl border border-stone-200 shadow-inner">
          <button
            type="button"
            onClick={() => setMainTab("landing")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "landing"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>1. Landing Page</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("shop")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "shop"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>2. Shop & Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("about")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "about"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>3. About Us</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("contact")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "contact"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>4. Contact Us</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("pages")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "pages"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>5. FAQ & Retur</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("footer")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              mainTab === "footer"
                ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>6. Footer & Socials</span>
          </button>
        </div>


        {/* ========================================================================= */}
        {/* CATEGORY 1: LANDING PAGE (BERANDA UTAMA) */}
        {/* ========================================================================= */}
        {mainTab === "landing" && (
          <div className="space-y-8 animate-fadeIn">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                1. Hero Accordion Banner (3 Slide Utama Beranda)
              </h2>
              <p className="text-xs text-stone-500">Pilih slide banner yang ingin Anda edit di bawah ini:</p>
            </div>
          </div>

          {/* Banner Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
            <button
              type="button"
              onClick={() => setActiveBannerTab(1)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeBannerTab === 1
                  ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <span>Slide 1: Brukat 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBannerTab(2)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeBannerTab === 2
                  ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <span>Slide 2: Renda Chantilly</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBannerTab(3)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeBannerTab === 3
                  ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <span>Slide 3: Metallic Lace</span>
            </button>
          </div>

          {/* TAB 1: BRUKAT 3D */}
          {activeBannerTab === 1 && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Slide 01 - Koleksi Brukat 3D Premium
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full">
                  BADGE: BRUKAT 3D
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sub-Judul / Label Atas Banner 1
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="KOLEKSI RAJA BRUKAT 2026"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Judul Utama Banner 1
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Keanggunan Kain Semi Prancis 3D Premium"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Tautan Tombol (Link CTA)
                  </label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="/shop"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                  Foto Latar Belakang Slide 1
                </label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption1"
                      checked={imageOption === "url"}
                      onChange={() => setImageOption("url")}
                      className="accent-[#b77305]"
                    />
                    <span>Gunakan URL Gambar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption1"
                      checked={imageOption === "upload"}
                      onChange={() => setImageOption("upload")}
                      className="accent-[#b77305]"
                    />
                    <span>Unggah dari Komputer</span>
                  </label>
                </div>

                {imageOption === "url" ? (
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/white_lace_hero.png atau https://..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                ) : (
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RENDA CHANTILLY */}
          {activeBannerTab === 2 && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Slide 02 - Renda Chantilly French
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full">
                  BADGE: CHANTILLY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sub-Judul / Label Atas Banner 2
                  </label>
                  <input
                    type="text"
                    value={panel2Subtitle}
                    onChange={(e) => setPanel2Subtitle(e.target.value)}
                    placeholder="RENDA CHANTILLY FRENCH"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Judul Utama Banner 2
                  </label>
                  <input
                    type="text"
                    value={panel2Title}
                    onChange={(e) => setPanel2Title(e.target.value)}
                    placeholder="Panel Brukat Chantily"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={panel2ButtonText}
                    onChange={(e) => setPanel2ButtonText(e.target.value)}
                    placeholder="Lihat Koleksi"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Tautan Tombol (Link CTA)
                  </label>
                  <input
                    type="text"
                    value={panel2ButtonLink}
                    onChange={(e) => setPanel2ButtonLink(e.target.value)}
                    placeholder="/shop?category=Renda Chantilly"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                  Foto Latar Belakang Slide 2
                </label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption2"
                      checked={panel2ImageOption === "url"}
                      onChange={() => setPanel2ImageOption("url")}
                      className="accent-[#b77305]"
                    />
                    <span>Gunakan URL Gambar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption2"
                      checked={panel2ImageOption === "upload"}
                      onChange={() => setPanel2ImageOption("upload")}
                      className="accent-[#b77305]"
                    />
                    <span>Unggah dari Komputer</span>
                  </label>
                </div>

                {panel2ImageOption === "url" ? (
                  <input
                    type="text"
                    value={panel2ImageUrl}
                    onChange={(e) => setPanel2ImageUrl(e.target.value)}
                    placeholder="/images/beige_lace_hero.png atau https://..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                ) : (
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPanel2ImageFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: METALLIC LACE */}
          {activeBannerTab === 3 && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Slide 03 - Metallic Lace Elegant
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full">
                  BADGE: METALLIC
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sub-Judul / Label Atas Banner 3
                  </label>
                  <input
                    type="text"
                    value={panel3Subtitle}
                    onChange={(e) => setPanel3Subtitle(e.target.value)}
                    placeholder="METALLIC LACE ELEGANT"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Judul Utama Banner 3
                  </label>
                  <input
                    type="text"
                    value={panel3Title}
                    onChange={(e) => setPanel3Title(e.target.value)}
                    placeholder="Panel Metallic Ellegant"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={panel3ButtonText}
                    onChange={(e) => setPanel3ButtonText(e.target.value)}
                    placeholder="Lihat Koleksi"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Tautan Tombol (Link CTA)
                  </label>
                  <input
                    type="text"
                    value={panel3ButtonLink}
                    onChange={(e) => setPanel3ButtonLink(e.target.value)}
                    placeholder="/shop?category=Metallic"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                  Foto Latar Belakang Slide 3
                </label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption3"
                      checked={panel3ImageOption === "url"}
                      onChange={() => setPanel3ImageOption("url")}
                      className="accent-[#b77305]"
                    />
                    <span>Gunakan URL Gambar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                    <input
                      type="radio"
                      name="imageOption3"
                      checked={panel3ImageOption === "upload"}
                      onChange={() => setPanel3ImageOption("upload")}
                      className="accent-[#b77305]"
                    />
                    <span>Unggah dari Komputer</span>
                  </label>
                </div>

                {panel3ImageOption === "url" ? (
                  <input
                    type="text"
                    value={panel3ImageUrl}
                    onChange={(e) => setPanel3ImageUrl(e.target.value)}
                    placeholder="/images/metallic_lace_hero.png atau https://..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                ) : (
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPanel3ImageFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN 2: HIGHLIGHT PRODUK UNGGULAN & TRUST BADGES (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                2. Section Highlight & Keunggulan Toko (Pancar Keanggunan Gayamu)
              </h2>
              <p className="text-xs text-stone-500">Kelola judul highlight utama, deskripsi, dan 3 badge keunggulan toko di beranda</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Judul Utama Highlight (Gunakan \n untuk pemisah kata berwarna/baris baru)
            </label>
            <input
              type="text"
              value={featuredTitle}
              onChange={(e) => setFeaturedTitle(e.target.value)}
              placeholder="Pancar \n Keanggunan \n Gayamu."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
            />
          </div>

          {/* 3 Overlapping Featured Cards (Gambar & Detail Highlight) */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#b77305]" /> 3 Gambar & Card Highlight Produk (Kanan Atas)
              </h3>
              <span className="text-[10px] text-stone-500 italic">
                *Jika dikosongkan, akan otomatis mengambil 3 produk terbaru dari katalog
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Card 1 (Kiri Belakang)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Judul / Nama Produk</label>
                  <input
                    type="text"
                    value={featuredCard1Title}
                    onChange={(e) => setFeaturedCard1Title(e.target.value)}
                    placeholder="Panel Brukat Polos Busana Pesta"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Deskripsi Penjelasan (Ganti Paragraf Saat Hover)</label>
                  <textarea
                    rows={3}
                    value={featuredCard1Desc}
                    onChange={(e) => setFeaturedCard1Desc(e.target.value)}
                    placeholder="Kondisi baru, Brukat polos dengan tekstur doff halus..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Link Tujuan CTA</label>
                  <input
                    type="text"
                    value={featuredCard1Link}
                    onChange={(e) => setFeaturedCard1Link(e.target.value)}
                    placeholder="/shop?category=Panel Brukat Polos"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">Foto Card 1</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard1ImgOption"
                        checked={featuredCard1ImgOption === "url"}
                        onChange={() => setFeaturedCard1ImgOption("url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard1ImgOption"
                        checked={featuredCard1ImgOption === "upload"}
                        onChange={() => setFeaturedCard1ImgOption("upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload</span>
                    </label>
                  </div>
                  {featuredCard1ImgOption === "url" ? (
                    <input
                      type="text"
                      value={featuredCard1ImgUrl}
                      onChange={(e) => setFeaturedCard1ImgUrl(e.target.value)}
                      placeholder="/images/renda_chantilly_french.png"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFeaturedCard1ImgFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Card 2 (Tengah Utama)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Judul / Nama Produk</label>
                  <input
                    type="text"
                    value={featuredCard2Title}
                    onChange={(e) => setFeaturedCard2Title(e.target.value)}
                    placeholder="Panel Full Metalic"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Deskripsi Penjelasan (Ganti Paragraf Saat Hover)</label>
                  <textarea
                    rows={3}
                    value={featuredCard2Desc}
                    onChange={(e) => setFeaturedCard2Desc(e.target.value)}
                    placeholder="Kondisi baru, memakai benang metalik..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Link Tujuan CTA</label>
                  <input
                    type="text"
                    value={featuredCard2Link}
                    onChange={(e) => setFeaturedCard2Link(e.target.value)}
                    placeholder="/shop?category=Panel Full Metalic"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">Foto Card 2</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard2ImgOption"
                        checked={featuredCard2ImgOption === "url"}
                        onChange={() => setFeaturedCard2ImgOption("url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard2ImgOption"
                        checked={featuredCard2ImgOption === "upload"}
                        onChange={() => setFeaturedCard2ImgOption("upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload</span>
                    </label>
                  </div>
                  {featuredCard2ImgOption === "url" ? (
                    <input
                      type="text"
                      value={featuredCard2ImgUrl}
                      onChange={(e) => setFeaturedCard2ImgUrl(e.target.value)}
                      placeholder="/images/brukat_tile_mutiara.png"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFeaturedCard2ImgFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Card 3 (Kanan Depan)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Judul / Nama Produk</label>
                  <input
                    type="text"
                    value={featuredCard3Title}
                    onChange={(e) => setFeaturedCard3Title(e.target.value)}
                    placeholder="Panel Renda Chantilly Impor"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Deskripsi Penjelasan (Ganti Paragraf Saat Hover)</label>
                  <textarea
                    rows={3}
                    value={featuredCard3Desc}
                    onChange={(e) => setFeaturedCard3Desc(e.target.value)}
                    placeholder="Serat renda Chantilly kualitas ekspor..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Link Tujuan CTA</label>
                  <input
                    type="text"
                    value={featuredCard3Link}
                    onChange={(e) => setFeaturedCard3Link(e.target.value)}
                    placeholder="/shop?category=Renda Chantilly"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">Foto Card 3</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard3ImgOption"
                        checked={featuredCard3ImgOption === "url"}
                        onChange={() => setFeaturedCard3ImgOption("url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="featuredCard3ImgOption"
                        checked={featuredCard3ImgOption === "upload"}
                        onChange={() => setFeaturedCard3ImgOption("upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload</span>
                    </label>
                  </div>
                  {featuredCard3ImgOption === "url" ? (
                    <input
                      type="text"
                      value={featuredCard3ImgUrl}
                      onChange={(e) => setFeaturedCard3ImgUrl(e.target.value)}
                      placeholder="/images/cornely_silk_satin.png"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFeaturedCard3ImgFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 3 Trust Badges */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">3 Badge Keunggulan Toko (Bawah Highlight)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase">Badge 1: Judul Utama</label>
                <input
                  type="text"
                  value={badge1Title}
                  onChange={(e) => setBadge1Title(e.target.value)}
                  placeholder="Garansi Retur"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                />
                <label className="block text-xs font-bold text-stone-700 uppercase">Sub-Judul</label>
                <input
                  type="text"
                  value={badge1Subtitle}
                  onChange={(e) => setBadge1Subtitle(e.target.value)}
                  placeholder="Kemudahan Tukar"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                />
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase">Badge 2: Judul Utama</label>
                <input
                  type="text"
                  value={badge2Title}
                  onChange={(e) => setBadge2Title(e.target.value)}
                  placeholder="100% Premium"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                />
                <label className="block text-xs font-bold text-stone-700 uppercase">Sub-Judul</label>
                <input
                  type="text"
                  value={badge2Subtitle}
                  onChange={(e) => setBadge2Subtitle(e.target.value)}
                  placeholder="Serat Halus Impor"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                />
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase">Badge 3: Judul Utama</label>
                <input
                  type="text"
                  value={badge3Title}
                  onChange={(e) => setBadge3Title(e.target.value)}
                  placeholder="Bebas Ongkir"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                />
                <label className="block text-xs font-bold text-stone-700 uppercase">Sub-Judul</label>
                <input
                  type="text"
                  value={badge3Subtitle}
                  onChange={(e) => setBadge3Subtitle(e.target.value)}
                  placeholder="Pengiriman Cepat"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 3: FILE KATALOG PDF */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                3. File Katalog PDF (/katalog)
              </h2>
              <p className="text-xs text-stone-500">Unggah atau masukkan URL file PDF katalog interaktif untuk menu Katalog di Navbar & Beranda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Section Katalog - Baris 1
              </label>
              <input
                type="text"
                value={catalogTitleLine1}
                onChange={(e) => setCatalogTitleLine1(e.target.value)}
                placeholder="Katalog"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Section Katalog - Baris 2 (Cetak Miring Emas)
              </label>
              <input
                type="text"
                value={catalogTitleLine2}
                onChange={(e) => setCatalogTitleLine2(e.target.value)}
                placeholder="Kain Eksklusif"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Pilih Sumber File PDF
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="catalogPdfOption"
                    value="url"
                    checked={catalogPdfOption === "url"}
                    onChange={() => setCatalogPdfOption("url")}
                    className="accent-[#b77305]"
                  />
                  <span className="text-sm font-medium">URL / Path Statis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="catalogPdfOption"
                    value="upload"
                    checked={catalogPdfOption === "upload"}
                    onChange={() => setCatalogPdfOption("upload")}
                    className="accent-[#b77305]"
                  />
                  <span className="text-sm font-medium">Unggah File PDF Baru</span>
                </label>
              </div>

              {catalogPdfOption === "url" ? (
                <input
                  type="text"
                  value={catalogPdfUrl}
                  onChange={(e) => setCatalogPdfUrl(e.target.value)}
                  placeholder="/Katalog.pdf atau https://..."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                />
              ) : (
                <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setCatalogPdfFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-stone-500">Hanya file PDF yang diperbolehkan</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center bg-stone-50 rounded-xl border border-stone-200 p-6">
               <div className="text-center space-y-3">
                 <div className="w-16 h-16 bg-white border border-stone-200 shadow-sm rounded-xl mx-auto flex items-center justify-center text-[#b77305]">
                   <BookOpen className="w-8 h-8" />
                 </div>
                 <p className="text-sm font-bold text-stone-800">Preview Katalog PDF</p>
                 <a href={catalogPdfOption === 'url' ? catalogPdfUrl : '#'} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-lg transition-colors">
                   Buka di Tab Baru
                 </a>
               </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 4: TENTANG BRAND (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                4. Tentang Brand (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Teks heading pada section "Tentang Kami" di halaman utama (Home)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Baris 1: Sub-Judul Kecil (Teks Emas Kapitals)
              </label>
              <input
                type="text"
                value={aboutSubtitle}
                onChange={(e) => setAboutSubtitle(e.target.value)}
                placeholder="KOLEKSI TEKSTIL EKSKLUSIF"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Baris 2: Judul Utama (Teks Hitam Serif)
              </label>
              <input
                type="text"
                value={aboutTitleLine1}
                onChange={(e) => setAboutTitleLine1(e.target.value)}
                placeholder="Didedikasikan Untuk"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Baris 3: Judul Utama (Teks Emas & Cetak Miring)
              </label>
              <input
                type="text"
                value={aboutTitleLine2}
                onChange={(e) => setAboutTitleLine2(e.target.value)}
                placeholder="Keindahan Kebaya & Gaun Mewah"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-bold text-[#b77305] transition-all"
              />
            </div>


            {/* Pemilihan 5 Produk Kategori Bulat */}
            <div className="md:col-span-3 pt-6 border-t border-stone-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Pengaturan 5 Produk Kategori Bulat (Kategori Swatches)
                </h3>
                <span className="text-[11px] text-stone-500 italic">
                  *Jika dikosongkan, sistem akan menampilkan 5 produk terbaru secara otomatis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[
                  { num: 1, val: aboutCircle1ProductId, setVal: setAboutCircle1ProductId },
                  { num: 2, val: aboutCircle2ProductId, setVal: setAboutCircle2ProductId },
                  { num: 3, val: aboutCircle3ProductId, setVal: setAboutCircle3ProductId },
                  { num: 4, val: aboutCircle4ProductId, setVal: setAboutCircle4ProductId },
                  { num: 5, val: aboutCircle5ProductId, setVal: setAboutCircle5ProductId },
                ].map((item) => (
                  <div key={item.num} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm space-y-2.5">
                    <label className="block text-[11px] font-bold text-[#b77305] uppercase tracking-wider">
                      Produk Bulat {item.num}
                    </label>
                    <select
                      value={item.val}
                      onChange={(e) => item.setVal(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all cursor-pointer"
                    >
                      <option value="">Otomatis ({item.num})</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Card Keunggulan & Filosofi Brand */}
            <div className="md:col-span-3 pt-6 border-t border-stone-100 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                3 Card Keunggulan & Filosofi Brand (Bagian Bawah Section Tentang Brand)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1 */}
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="inline-block px-2.5 py-1 bg-[#b77305]/10 text-[#b77305] rounded-md text-[11px] font-bold uppercase tracking-wider">
                      Card Keunggulan 1
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Judul Utama</label>
                      <input
                        type="text"
                        value={aboutPagePhil1Title}
                        onChange={(e) => setAboutPagePhil1Title(e.target.value)}
                        placeholder="01. Kualitas Premium Impor"
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Deskripsi Penjelasan</label>
                      <textarea
                        rows={4}
                        value={aboutPagePhil1Desc}
                        onChange={(e) => setAboutPagePhil1Desc(e.target.value)}
                        placeholder="Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 leading-relaxed focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="inline-block px-2.5 py-1 bg-[#b77305]/10 text-[#b77305] rounded-md text-[11px] font-bold uppercase tracking-wider">
                      Card Keunggulan 2
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Judul Utama</label>
                      <input
                        type="text"
                        value={aboutPagePhil2Title}
                        onChange={(e) => setAboutPagePhil2Title(e.target.value)}
                        placeholder="02. Motif Anggun & Mewah"
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Deskripsi Penjelasan</label>
                      <textarea
                        rows={4}
                        value={aboutPagePhil2Desc}
                        onChange={(e) => setAboutPagePhil2Desc(e.target.value)}
                        placeholder="Desain bordir bunga 3D, cornely timbul, dan taburan mutiara..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 leading-relaxed focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="inline-block px-2.5 py-1 bg-[#b77305]/10 text-[#b77305] rounded-md text-[11px] font-bold uppercase tracking-wider">
                      Card Keunggulan 3
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Judul Utama</label>
                      <input
                        type="text"
                        value={aboutPagePhil3Title}
                        onChange={(e) => setAboutPagePhil3Title(e.target.value)}
                        placeholder="03. Pelayanan Eceran & Grosir"
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">Deskripsi Penjelasan</label>
                      <textarea
                        rows={4}
                        value={aboutPagePhil3Desc}
                        onChange={(e) => setAboutPagePhil3Desc(e.target.value)}
                        placeholder="Melayani pembelian eceran per meter maupun gulungan roll besar..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 leading-relaxed focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* BAGIAN 5: RILIS KOLEKSI KAIN TERBARU (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                5. Section Rilis Koleksi Kain Terbaru (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Kelola badge label, judul baris 1 & 2, serta deskripsi bagian rilis koleksi kain terbaru</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Badge / Label Atas (Koleksi Motif Terbaru)
              </label>
              <input
                type="text"
                value={latestBadge}
                onChange={(e) => setLatestBadge(e.target.value)}
                placeholder="KOLEKSI MOTIF TERBARU"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Baris 1
              </label>
              <input
                type="text"
                value={latestTitleLine1}
                onChange={(e) => setLatestTitleLine1(e.target.value)}
                placeholder="Rilis Koleksi Kain"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Baris 2 (Cetak Miring Emas)
              </label>
              <input
                type="text"
                value={latestTitleLine2}
                onChange={(e) => setLatestTitleLine2(e.target.value)}
                placeholder="Terbaru & Eksklusif"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi Singkat Section
              </label>
              <textarea
                rows={3}
                value={latestDesc}
                onChange={(e) => setLatestDesc(e.target.value)}
                placeholder="Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 6: PENAWARAN / DEALS (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                6. Penawaran Tekstil Eksklusif & Deals (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Atur teks untuk bagian "Penawaran Tekstil Eksklusif" di halaman utama</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Badge Promo (Kecil)
              </label>
              <input
                type="text"
                value={dealsBadge}
                onChange={(e) => setDealsBadge(e.target.value)}
                placeholder="PROMO SPESIAL TERBATAS"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama
              </label>
              <input
                type="text"
                value={dealsTitle}
                onChange={(e) => setDealsTitle(e.target.value)}
                placeholder="Penawaran Tekstil Eksklusif"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi
              </label>
              <textarea
                value={dealsDescription}
                onChange={(e) => setDealsDescription(e.target.value)}
                rows={3}
                placeholder="Dapatkan penawaran harga spesial untuk kain brukat pilihan..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Pilih Produk Penawaran (Opsional)
              </label>
              <select
                value={dealsProductId}
                onChange={(e) => setDealsProductId(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              >
                <option value="">-- Pilih Produk Secara Otomatis (Produk Terbaru) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Rp {p.price?.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500 mt-2">Jika Anda tidak memilih produk secara spesifik, sistem akan otomatis memilih produk terbaru yang tersedia.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Harga Coret Diskon Promo (Rp)
              </label>
              <input
                type="number"
                value={dealsDiscountPrice}
                onChange={(e) => setDealsDiscountPrice(e.target.value)}
                placeholder="Misal: 159000 (Kosongkan jika mengikuti diskon produk)"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
              <p className="text-xs text-stone-500 mt-1">Kosongkan jika ingin mengikuti harga diskon bawaan produk.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Waktu Berakhir Promo (Hitung Mundur / Countdown)
              </label>
              <input
                type="datetime-local"
                value={dealsEndsAt}
                onChange={(e) => setDealsEndsAt(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
              <p className="text-xs text-stone-500 mt-1">Tentukan tanggal & jam kapan promo berakhir. Hitung mundur akan otomatis berjalan di beranda.</p>
            </div>

            <div className="md:col-span-2 border-t border-stone-100 pt-4 space-y-3">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                3 Point Keunggulan Promo (Checkmark Poin di Bawah Harga)
              </label>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Point 1</label>
                  <input
                    type="text"
                    value={dealsPoint1}
                    onChange={(e) => setDealsPoint1(e.target.value)}
                    placeholder="Motif bordir rapat dengan taburan payet mutiara timbul 3D"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Point 2</label>
                  <input
                    type="text"
                    value={dealsPoint2}
                    onChange={(e) => setDealsPoint2(e.target.value)}
                    placeholder="Serat renda Chantilly & tile ekspor yang sangat halus di kulit"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Point 3</label>
                  <input
                    type="text"
                    value={dealsPoint3}
                    onChange={(e) => setDealsPoint3(e.target.value)}
                    placeholder="Stok promo sangat terbatas (Sisa 15 Meter Terakhir)"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 6: INTERAKTIF FABRIC COMPARISON SLIDER (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                6. Interaktif Fabric Comparison Slider (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Kelola judul, label kain kiri/kanan, dan gambar perbandingan bahan kain interaktif di beranda</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Section Compare
              </label>
              <input
                type="text"
                value={compareTitle}
                onChange={(e) => setCompareTitle(e.target.value)}
                placeholder="Compare Textile Quality"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kiri / Before Fabric */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Kain Sisi Kiri (Before Fabric)
                </h3>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Label Nama Kain (Contoh: Semi Prancis 3D)
                  </label>
                  <input
                    type="text"
                    value={compareBeforeLabel}
                    onChange={(e) => setCompareBeforeLabel(e.target.value)}
                    placeholder="Semi Prancis 3D"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">Pilih Sumber Gambar Kiri</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="compareBeforeImgOption"
                        checked={compareBeforeImgOption === "url"}
                        onChange={() => setCompareBeforeImgOption("url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="compareBeforeImgOption"
                        checked={compareBeforeImgOption === "upload"}
                        onChange={() => setCompareBeforeImgOption("upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload</span>
                    </label>
                  </div>
                  {compareBeforeImgOption === "url" ? (
                    <input
                      type="text"
                      value={compareBeforeImage}
                      onChange={(e) => setCompareBeforeImage(e.target.value)}
                      placeholder="/images/white_lace_hero.png"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCompareBeforeImgFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white"
                    />
                  )}
                </div>
              </div>

              {/* Kanan / After Fabric */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Kain Sisi Kanan (After Fabric)
                </h3>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Label Nama Kain (Contoh: Metallic Elegant)
                  </label>
                  <input
                    type="text"
                    value={compareAfterLabel}
                    onChange={(e) => setCompareAfterLabel(e.target.value)}
                    placeholder="Metallic Elegant"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-2">Pilih Sumber Gambar Kanan</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="compareAfterImgOption"
                        checked={compareAfterImgOption === "url"}
                        onChange={() => setCompareAfterImgOption("url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name="compareAfterImgOption"
                        checked={compareAfterImgOption === "upload"}
                        onChange={() => setCompareAfterImgOption("upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload</span>
                    </label>
                  </div>
                  {compareAfterImgOption === "url" ? (
                    <input
                      type="text"
                      value={compareAfterImage}
                      onChange={(e) => setCompareAfterImage(e.target.value)}
                      placeholder="/images/metallic_lace_hero.png"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCompareAfterImgFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 8: GALERI LOOKBOOK & INSPIRASI BUSANA (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                8. Galeri Lookbook & Inspirasi Busana (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Kelola judul & deskripsi bagian "Galeri Lookbook & Inspirasi Busana Kebaya" di beranda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Sub-judul Badge Promo (Kecil)
              </label>
              <input
                type="text"
                value={lookbookBadge}
                onChange={(e) => setLookbookBadge(e.target.value)}
                placeholder="INSPIRASI BUSANA KEBAYA & GAUN MEWAH"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Baris 1
              </label>
              <input
                type="text"
                value={lookbookTitleLine1}
                onChange={(e) => setLookbookTitleLine1(e.target.value)}
                placeholder="Galeri Lookbook &"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Baris 2 (Cetak Miring Emas)
              </label>
              <input
                type="text"
                value={lookbookTitleLine2}
                onChange={(e) => setLookbookTitleLine2(e.target.value)}
                placeholder="Inspirasi Busana Kebaya"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi Singkat Section Lookbook
              </label>
              <textarea
                rows={3}
                value={lookbookDesc}
                onChange={(e) => setLookbookDesc(e.target.value)}
                placeholder="Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            {/* 4 Cards Product Selector & Custom Titles */}
            <div className="md:col-span-2 pt-4 border-t border-stone-100 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Pengaturan Nama & Produk untuk Ke-4 Kartu Lookbook
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                      Nama Tag Kartu 1
                    </label>
                    <input
                      type="text"
                      value={lookbookCard1Tag}
                      onChange={(e) => setLookbookCard1Tag(e.target.value)}
                      placeholder="KEBAYA PENGANTIN"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Produk Bahan Kain
                    </label>
                    <select
                      value={lookbookCard1ProductId}
                      onChange={(e) => setLookbookCard1ProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Otomatis (Produk ke-1) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price?.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                      Nama Tag Kartu 2
                    </label>
                    <input
                      type="text"
                      value={lookbookCard2Tag}
                      onChange={(e) => setLookbookCard2Tag(e.target.value)}
                      placeholder="GAUN PESTA"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Produk Bahan Kain
                    </label>
                    <select
                      value={lookbookCard2ProductId}
                      onChange={(e) => setLookbookCard2ProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Otomatis (Produk ke-2) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price?.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                      Nama Tag Kartu 3
                    </label>
                    <input
                      type="text"
                      value={lookbookCard3Tag}
                      onChange={(e) => setLookbookCard3Tag(e.target.value)}
                      placeholder="SERAGAM BRIDESMAID"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Produk Bahan Kain
                    </label>
                    <select
                      value={lookbookCard3ProductId}
                      onChange={(e) => setLookbookCard3ProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Otomatis (Produk ke-3) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price?.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                      Nama Tag Kartu 4
                    </label>
                    <input
                      type="text"
                      value={lookbookCard4Tag}
                      onChange={(e) => setLookbookCard4Tag(e.target.value)}
                      placeholder="KEBAYA WISUDA"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Produk Bahan Kain
                    </label>
                    <select
                      value={lookbookCard4ProductId}
                      onChange={(e) => setLookbookCard4ProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Otomatis (Produk ke-4) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rp {p.price?.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500">Anda dapat mengubah label nama kartu di atas sesuai keinginan. Jika produk tidak dipilih secara manual, sistem akan mengambil produk otomatis.</p>
            </div>
          </div>
        </div>

        {/* BAGIAN 9: SECTION BEST SELLERS (BERANDA) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                9. Section Best Sellers (Beranda)
              </h2>
              <p className="text-xs text-stone-500">Kelola judul & deskripsi bagian produk Best Sellers di beranda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Best Sellers
              </label>
              <input
                type="text"
                value={bestSellersTitle}
                onChange={(e) => setBestSellersTitle(e.target.value)}
                placeholder="Best Sellers."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi Singkat Sub-judul
              </label>
              <textarea
                rows={3}
                value={bestSellersDescription}
                onChange={(e) => setBestSellersDescription(e.target.value)}
                placeholder="The pieces everyone is talking about. Grab them before they're gone."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 2: HALAMAN TENTANG KAMI (/about) */}
        {/* ========================================================================= */}
        {mainTab === "about" && (
          <div className="space-y-8 animate-fadeIn">
            {/* BAGIAN 3: HALAMAN TENTANG KAMI (/about) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                1. Halaman Tentang Kami & 3 Pilar Utama (/about)
              </h2>
              <p className="text-xs text-stone-500">Kelola kisah brand di /about, serta 3 Pilar Nilai Utama (ditampilkan di Beranda & halaman About)</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Utama Halaman About Us (Gunakan \n untuk baris baru)
              </label>
              <input
                type="text"
                value={aboutPageTitle}
                onChange={(e) => setAboutPageTitle(e.target.value)}
                placeholder="Keanggunan Tekstil Kebaya \n Mewah & Eksklusif Raja Brukat"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Paragraf Utama / Pembuka Story Raja Brukat
              </label>
              <textarea
                rows={3}
                value={aboutPageStory1}
                onChange={(e) => setAboutPageStory1(e.target.value)}
                placeholder="Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Paragraf Kedua / Detail Komitmen & Kualitas (Gunakan \n\n untuk paragraf baru)
              </label>
              <textarea
                rows={4}
                value={aboutPageStory2}
                onChange={(e) => setAboutPageStory2(e.target.value)}
                placeholder="Berdiri dengan komitmen menyajikan keindahan tekstil terbaik..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                Gambar Showcase Visual Banner Halaman About Us
              </label>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                  <input
                    type="radio"
                    name="aboutPageImgOption"
                    checked={aboutPageImgOption === "url"}
                    onChange={() => setAboutPageImgOption("url")}
                    className="accent-[#b77305]"
                  />
                  <span>Gunakan URL Gambar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-stone-700">
                  <input
                    type="radio"
                    name="aboutPageImgOption"
                    checked={aboutPageImgOption === "upload"}
                    onChange={() => setAboutPageImgOption("upload")}
                    className="accent-[#b77305]"
                  />
                  <span>Unggah dari Komputer</span>
                </label>
              </div>

              {aboutPageImgOption === "url" ? (
                <input
                  type="text"
                  value={aboutPageImgUrl}
                  onChange={(e) => setAboutPageImgUrl(e.target.value)}
                  placeholder="/images/brukat_tile_mutiara.png atau https://..."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                />
              ) : (
                <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAboutPageImgFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Teks Tagline Overlay pada Gambar Showcase
                  </label>
                  <input
                    type="text"
                    value={aboutPageImgText}
                    onChange={(e) => setAboutPageImgText(e.target.value)}
                    placeholder="Kemewahan Tanpa Kompromi."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Teks Subtitle Overlay pada Gambar Showcase
                  </label>
                  <textarea
                    rows={3}
                    value={aboutPageImgSubtext}
                    onChange={(e) => setAboutPageImgSubtext(e.target.value)}
                    placeholder="Perpaduan seni bordir presisi tinggi, taburan kristal bercahaya, serta kelembutan serat renda impor kualitas ekspor."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3 Pilar Nilai Utama */}
            <div className="pt-6 border-t border-stone-100 space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#b77305]" /> 3 Pilar Nilai Utama Brand
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Pilar 1: Judul</label>
                  <input
                    type="text"
                    value={aboutPagePhil1Title}
                    onChange={(e) => setAboutPagePhil1Title(e.target.value)}
                    placeholder="01. Kualitas Premium Impor"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={aboutPagePhil1Desc}
                    onChange={(e) => setAboutPagePhil1Desc(e.target.value)}
                    placeholder="Serat renda Chantilly dan tile pilihan..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Pilar 2: Judul</label>
                  <input
                    type="text"
                    value={aboutPagePhil2Title}
                    onChange={(e) => setAboutPagePhil2Title(e.target.value)}
                    placeholder="02. Motif Anggun & Mewah"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={aboutPagePhil2Desc}
                    onChange={(e) => setAboutPagePhil2Desc(e.target.value)}
                    placeholder="Desain bordir bunga 3D, cornely timbul..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Pilar 3: Judul</label>
                  <input
                    type="text"
                    value={aboutPagePhil3Title}
                    onChange={(e) => setAboutPagePhil3Title(e.target.value)}
                    placeholder="03. Pelayanan Eceran & Grosir"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={aboutPagePhil3Desc}
                    onChange={(e) => setAboutPagePhil3Desc(e.target.value)}
                    placeholder="Melayani pembelian eceran per meter maupun roll..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-normal"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 2: HALAMAN SHOP & KATALOG (/shop) */}
        {/* ========================================================================= */}
        {mainTab === "shop" && (
          <div className="space-y-8 animate-fadeIn">
            {/* BAGIAN 4: HALAMAN KATALOG / SHOP HEADER */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                1. Header Banner Halaman Shop (/shop)
              </h2>
              <p className="text-xs text-stone-500">Teks header banner pada halaman daftar produk `/shop`</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Judul Halaman Shop
              </label>
              <input
                type="text"
                value={shopTitle}
                onChange={(e) => setShopTitle(e.target.value)}
                placeholder="Katalog Kain Brukat & Renda Premium"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi Halaman Shop
              </label>
              <textarea
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                rows={3}
                placeholder="Temukan koleksi motif brukat mutiara, renda chantilly, dan cornely 3D terbaik untuk gaun dan kebaya Anda."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: KELOLA BANNER HEADER KATEGORI PRODUK (/collections/*) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                  2. Kelola Banner Header Kategori Produk (/collections/*)
                </h2>
                <p className="text-xs text-stone-500">
                  Tambah, edit, atau hapus banner header halaman kategori produk (seperti `/collections/grade-a`, `/collections/chantilly`, dll)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCategoryBanner}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b77305] hover:bg-[#965e04] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Banner Kategori Baru</span>
            </button>
          </div>

          <div className="space-y-6">
            {categoryBanners.map((cat, idx) => (
              <div key={cat.id} className="p-5 sm:p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-5 shadow-sm hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#b77305] text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                      {cat.title || `KATEGORI ${cat.slug.toUpperCase()}`}
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 bg-stone-200 text-stone-700 rounded-full font-mono font-medium">
                      /collections/{cat.slug || "kategori"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryBanner(cat.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Hapus Banner Kategori Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Slug URL (/collections/[slug])
                    </label>
                    <input
                      type="text"
                      value={cat.slug}
                      onChange={(e) => handleUpdateCategoryBanner(cat.id, "slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="grade-a"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                      required
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">Contoh URL: /collections/{cat.slug || "nama-kategori"}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Tagline Kecil Header
                    </label>
                    <input
                      type="text"
                      value={cat.tagline}
                      onChange={(e) => handleUpdateCategoryBanner(cat.id, "tagline", e.target.value)}
                      placeholder="Koleksi Super Premium"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Judul Utama Halaman Banner
                    </label>
                    <input
                      type="text"
                      value={cat.title}
                      onChange={(e) => handleUpdateCategoryBanner(cat.id, "title", e.target.value)}
                      placeholder="KATEGORI GRADE A"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Deskripsi Penjelasan Kategori
                  </label>
                  <textarea
                    rows={2}
                    value={cat.description}
                    onChange={(e) => handleUpdateCategoryBanner(cat.id, "description", e.target.value)}
                    placeholder="Deskripsi penjelasan kualitas dan jenis kain pada kategori ini..."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Foto Latar Belakang Banner
                  </label>
                  <div className="flex items-center gap-6 mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name={`imgOpt-${cat.id}`}
                        checked={cat.imgOption !== "upload"}
                        onChange={() => handleUpdateCategoryBanner(cat.id, "imgOption", "url")}
                        className="accent-[#b77305]"
                      />
                      <span>URL Gambar</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="radio"
                        name={`imgOpt-${cat.id}`}
                        checked={cat.imgOption === "upload"}
                        onChange={() => handleUpdateCategoryBanner(cat.id, "imgOption", "upload")}
                        className="accent-[#b77305]"
                      />
                      <span>Upload Komputer</span>
                    </label>
                  </div>

                  {cat.imgOption !== "upload" ? (
                    <input
                      type="text"
                      value={cat.image}
                      onChange={(e) => handleUpdateCategoryBanner(cat.id, "image", e.target.value)}
                      placeholder="/images/brukat_tile_mutiara.png"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpdateCategoryBanner(cat.id, "imgFile", e.target.files?.[0] || null)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b77305] file:text-white cursor-pointer"
                    />
                  )}
                </div>
              </div>
            ))}

            {categoryBanners.length === 0 && (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-3">
                <p className="text-sm font-medium text-stone-500">Belum ada banner kategori yang ditambahkan.</p>
                <button
                  type="button"
                  onClick={handleAddCategoryBanner}
                  className="px-4 py-2 bg-[#b77305] text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                >
                  Tambah Banner Kategori Pertama
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 4: HALAMAN CONTACT US (/pages/contact) */}
        {/* ========================================================================= */}
        {mainTab === "contact" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                    1. Header Banner & Informasi Kontak (/pages/contact)
                  </h2>
                  <p className="text-xs text-stone-500">Kelola judul hero banner, nomor WhatsApp hotline, email resmi, dan alamat gudang</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Judul Banner Kontak
                  </label>
                  <input
                    type="text"
                    value={contactHeroTitle}
                    onChange={(e) => setContactHeroTitle(e.target.value)}
                    placeholder="Layanan & Konsultasi Kain Raja Brukat"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sub-judul Banner
                  </label>
                  <input
                    type="text"
                    value={contactHeroSubtitle}
                    onChange={(e) => setContactHeroSubtitle(e.target.value)}
                    placeholder="HUBUNGI TIM CS KAMI"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Nomor WhatsApp CS Hotline Tampilan (cth: +62 858-8166-7778)
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+62 858-8166-7778"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Nomor WhatsApp Link API (Hanya angka tanpa +, cth: 6285881667778)
                  </label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="6285881667778"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Email Resmi Perusahaan
                  </label>
                  <input
                    type="text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@rajabrukat.com"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Jam Operasional CS
                  </label>
                  <input
                    type="text"
                    value={contactHours}
                    onChange={(e) => setContactHours(e.target.value)}
                    placeholder="Senin - Sabtu: 08:00 - 17:00 WIB"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Alamat Gudang & Pusat Distribusi
                  </label>
                  <textarea
                    rows={2}
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Pusat Tekstil Raja Brukat, Indonesia"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 5: HALAMAN FAQ & KEBIJAKAN RETUR */}
        {/* ========================================================================= */}
        {mainTab === "pages" && (
          <div className="space-y-8 animate-fadeIn">
            {/* FAQ Section */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                    1. Pengaturan Header Halaman FAQ (/pages/faq)
                  </h2>
                  <p className="text-xs text-stone-500">Kelola judul dan deskripsi utama halaman Pertanyaan Umum (FAQ)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Judul Halaman FAQ</label>
                  <input
                    type="text"
                    value={faqPageTitle}
                    onChange={(e) => setFaqPageTitle(e.target.value)}
                    placeholder="Pertanyaan Umum (FAQ)"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Sub-judul / Deskripsi FAQ</label>
                  <textarea
                    rows={2}
                    value={faqPageSubtitle}
                    onChange={(e) => setFaqPageSubtitle(e.target.value)}
                    placeholder="Temukan jawaban lengkap seputar pembelian kain..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              {/* FAQ Items CRUD List */}
              <div className="pt-6 border-t border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Daftar Pertanyaan FAQ ({faqItems.length} Item)
                    </h3>
                    <p className="text-xs text-stone-500">Tambah, edit, atau hapus item pertanyaan FAQ yang tampil di website</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewFaq}
                    className="px-4 py-2 bg-[#b77305] hover:bg-[#965e04] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah FAQ Baru</span>
                  </button>
                </div>

                {/* Modal Popup Dialog / Add Edit FAQ */}
                {isFaqFormOpen && (
                  <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative animate-scaleUp">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                        <div>
                          <h4 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                            {editingFaqId ? "Edit Item Pertanyaan FAQ" : "Tambah Pertanyaan FAQ Baru"}
                          </h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {editingFaqId ? "Ubah kategori, pertanyaan, atau jawaban FAQ" : "Buat pertanyaan & jawaban baru untuk pengunjung website"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFaqFormOpen(false)}
                          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Kategori FAQ</label>
                          <select
                            value={faqFormCategory}
                            onChange={(e) => setFaqFormCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold"
                          >
                            <option value="Pemesanan & Ukuran">Pemesanan & Ukuran</option>
                            <option value="Spesifikasi Kain">Spesifikasi Kain</option>
                            <option value="Pengiriman & Grosir">Pengiriman & Grosir</option>
                            <option value="Garansi & Retur">Garansi & Retur</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Pertanyaan</label>
                          <input
                            type="text"
                            value={faqFormQuestion}
                            onChange={(e) => setFaqFormQuestion(e.target.value)}
                            placeholder="Berapa minimal pembelian kain di Raja Brukat?"
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Jawaban Lengkap</label>
                          <textarea
                            rows={5}
                            value={faqFormAnswer}
                            onChange={(e) => setFaqFormAnswer(e.target.value)}
                            placeholder="Tuliskan penjelasan jawaban secara lengkap..."
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => setIsFaqFormOpen(false)}
                          className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveFaq}
                          className="px-6 py-2.5 bg-[#b77305] hover:bg-[#965e04] text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-[#b77305]/20 transition-all"
                        >
                          {editingFaqId ? "Simpan Perubahan FAQ" : "Tambah Item FAQ"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}


                {/* FAQ List Cards */}
                <div className="space-y-3">
                  {faqItems.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between gap-4 hover:border-stone-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#b77305]/10 text-[#b77305] rounded text-[10px] font-bold uppercase tracking-wider">
                            {faq.category}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-stone-900">{faq.question}</h5>
                        <p className="text-xs text-stone-600 font-normal line-clamp-2">{faq.answer}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFaq(faq)}
                          className="p-1.5 text-stone-600 hover:text-[#b77305] hover:bg-stone-200 rounded-lg transition-colors"
                          title="Edit FAQ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* Returns Section */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                    2. Pengaturan Halaman Kebijakan Retur (/pages/returns)
                  </h2>
                  <p className="text-xs text-stone-500">Kelola judul, sub-judul, dan ke-3 poin aturan garansi retur kain</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Judul Utama Halaman Retur</label>
                  <input
                    type="text"
                    value={returnsPageTitle}
                    onChange={(e) => setReturnsPageTitle(e.target.value)}
                    placeholder="Kebijakan Garansi & Retur Kain"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Sub-judul Komitmen Garansi</label>
                  <textarea
                    rows={2}
                    value={returnsPageSubtitle}
                    onChange={(e) => setReturnsPageSubtitle(e.target.value)}
                    placeholder="Komitmen Raja Brukat untuk memberikan jaminan kualitas 100%..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              {/* 3 Detail Poin Aturan Retur */}
              <div className="pt-6 border-t border-stone-100 space-y-6">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Pengaturan 3 Poin Utama Kebijakan Retur
                </h3>

                {/* Section 1 */}
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 1: Judul Poin</label>
                  <input
                    type="text"
                    value={returnsSection1Title}
                    onChange={(e) => setReturnsSection1Title(e.target.value)}
                    placeholder="1. Ketentuan Garansi & Syarat Retur"
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 1: Isi Penjelasan Kebijakan</label>
                  <textarea
                    rows={3}
                    value={returnsSection1Desc}
                    onChange={(e) => setReturnsSection1Desc(e.target.value)}
                    placeholder="Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu..."
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-normal"
                  />
                </div>

                {/* Section 2 */}
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 2: Judul Poin</label>
                  <input
                    type="text"
                    value={returnsSection2Title}
                    onChange={(e) => setReturnsSection2Title(e.target.value)}
                    placeholder="2. Syarat Wajib Video Unboxing"
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 2: Isi Penjelasan Syarat Video</label>
                  <textarea
                    rows={3}
                    value={returnsSection2Desc}
                    onChange={(e) => setReturnsSection2Desc(e.target.value)}
                    placeholder="Demi kenyamanan bersama dan validasi klaim garansi retur..."
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-normal"
                  />
                </div>

                {/* Section 3 */}
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 3: Judul Poin</label>
                  <input
                    type="text"
                    value={returnsSection3Title}
                    onChange={(e) => setReturnsSection3Title(e.target.value)}
                    placeholder="3. Tata Cara Mengajukan Retur"
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                  />
                  <label className="block text-xs font-bold text-stone-700 uppercase">Poin 3: Langkah-langkah Pengajuan (Format Per Baris)</label>
                  <textarea
                    rows={4}
                    value={returnsSection3Desc}
                    onChange={(e) => setReturnsSection3Desc(e.target.value)}
                    placeholder="1. Hubungi CS WhatsApp Hotline...\n2. Kirimkan foto resi...\n3. CS akan memverifikasi..."
                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-normal"
                  />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* CATEGORY 6: FOOTER & SOSIAL MEDIA */}
        {/* ========================================================================= */}
        {mainTab === "footer" && (
          <div className="space-y-8 animate-fadeIn">
            {/* BAGIAN 6: FOOTER & SOSIAL MEDIA */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wide">
                1. Deskripsi Footer & Tautan Sosial Media
              </h2>
              <p className="text-xs text-stone-500">Deskripsi singkat toko di bagian bawah footer dan tautan akun media sosial</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Deskripsi Brand di Footer
              </label>
              <textarea
                value={footerDesc}
                onChange={(e) => setFooterDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Tautan Instagram URL
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/rajabrukat_id"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Tautan Facebook URL
              </label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/rajabrukat"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Tautan TikTok URL
              </label>
              <input
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@rajabrukatofficial"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Tautan WhatsApp Hotline URL
              </label>
              <input
                type="text"
                value={whatsappUrl}
                onChange={(e) => setWhatsappUrl(e.target.value)}
                placeholder="https://wa.me/6285881667778"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#b77305]/20 focus:border-[#b77305] text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>
        </div>
        )}

        {/* Submit Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#b77305] hover:bg-[#965e04] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-[#b77305]/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Menyimpan Perubahan..." : "Simpan Semua Konfigurasi Site CMS"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
