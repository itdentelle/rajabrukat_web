"use client";

import { Reveal } from "@/components/ui/Reveal";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Gem, Award, Truck } from "lucide-react";

export default function AboutPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch((err) => console.error("Error fetching config:", err));
  }, []);

  const rawStory1 = config?.aboutPageStory1;
  const story1 = (!rawStory1 || rawStory1.includes("DragonWorm") || rawStory1.includes("concrete streets"))
    ? "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi."
    : rawStory1;

  const rawStory2 = config?.aboutPageStory2;
  const story2 = (!rawStory2 || rawStory2.includes("DragonWorm") || rawStory2.includes("gritty street"))
    ? "Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan ratusan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta modern, seragam keluarga bridesmaid, hingga busana pengantin akad & resepsi.\n\nSetiap roll kain dikurasi secara teliti dengan kerapatan bordir presisi, hiasan mutiara timbul 3D, serta tekstur lembut yang sangat nyaman dan dingin dipakai sepanjang hari."
    : rawStory2;

  const rawTitle = config?.aboutPageTitle;
  const pageTitle = (!rawTitle || rawTitle.includes("Underground") || rawTitle.includes("DragonWorm"))
    ? "Keanggunan Tekstil Kebaya \n Mewah & Eksklusif Raja Brukat"
    : rawTitle;

  return (
    <div className="min-h-screen bg-white text-stone-900 pt-24 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <Reveal>
          <h1 className="text-4xl md:text-7xl font-serif font-medium tracking-tight leading-[1.1] mb-8 text-stone-950">
            {pageTitle.split('\n').map((line: string, i: number) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 items-center">
          <Reveal delay={0.2}>
            <p className="text-xl md:text-2xl font-serif font-light leading-relaxed text-[#b77305]">
              {story1}
            </p>
          </Reveal>
          
          <Reveal delay={0.3}>
            <div className="text-stone-600 leading-relaxed space-y-5 font-light text-base md:text-lg">
              {story2.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Visual Showcase Banner */}
      <section className="w-full h-[50vh] md:h-[65vh] relative overflow-hidden bg-stone-950 my-8">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/60 z-10" />
        <img 
          src={config?.aboutPageImgUrl || "/images/brukat_tile_mutiara.png"} 
          alt="Raja Brukat Premium Fabric Showcase" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
          <Reveal>
            <h2 className="text-[#b77305] text-3xl md:text-6xl font-serif font-medium uppercase tracking-wider mb-4 drop-shadow-lg">
              {config?.aboutPageImgText || "Kemewahan Tanpa Kompromi."}
            </h2>
            <p className="text-stone-200 text-sm md:text-lg font-light max-w-2xl mx-auto">
              {config?.aboutPageImgSubtext || "Perpaduan seni bordir presisi tinggi, taburan kristal bercahaya, serta kelembutan serat renda impor kualitas ekspor."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Philosophy & Pillars Section */}
      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#b77305] text-xs font-bold uppercase tracking-widest block mb-2">NILAI UTAMA BRAND</span>
          <h3 className="text-3xl md:text-4xl font-serif font-medium text-stone-950">Keunggulan Kain Raja Brukat</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Reveal delay={0.1}>
            <div className="p-8 bg-gradient-to-b from-[#faf8f5] to-[#f5eee6] border border-[#b77305]/20 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#b77305]/10 border border-[#b77305]/30 flex items-center justify-center text-[#b77305] mb-6">
                <Gem className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-serif font-bold tracking-wide mb-3 text-stone-950">{config?.aboutPagePhil1Title || "01. Kualitas Premium Impor"}</h4>
              <p className="text-stone-600 text-sm leading-relaxed font-light">{config?.aboutPagePhil1Desc || "Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit, tahan lama, dingin, dan tidak gatal."}</p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-8 bg-gradient-to-b from-[#faf8f5] to-[#f5eee6] border border-[#b77305]/20 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#b77305]/10 border border-[#b77305]/30 flex items-center justify-center text-[#b77305] mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-serif font-bold tracking-wide mb-3 text-stone-950">{config?.aboutPagePhil2Title || "02. Motif Anggun & Mewah"}</h4>
              <p className="text-stone-600 text-sm leading-relaxed font-light">{config?.aboutPagePhil2Desc || "Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang sangat mewah untuk segala momen istimewa."}</p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="p-8 bg-gradient-to-b from-[#faf8f5] to-[#f5eee6] border border-[#b77305]/20 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#b77305]/10 border border-[#b77305]/30 flex items-center justify-center text-[#b77305] mb-6">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-serif font-bold tracking-wide mb-3 text-stone-950">{config?.aboutPagePhil3Title || "03. Pelayanan Eceran & Grosir"}</h4>
              <p className="text-stone-600 text-sm leading-relaxed font-light">{config?.aboutPagePhil3Desc || "Melayani pembelian eceran per meter maupun gulungan roll besar untuk desainer, penjahit, dan seragam acara."}</p>
            </div>
          </Reveal>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="px-10 py-4 font-medium text-white transition-all duration-300 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] rounded-full shadow-xl shadow-[#b77305]/25 hover:scale-[1.03] inline-flex items-center gap-3"
          >
            <span className="uppercase tracking-widest text-xs font-bold">Jelajahi Koleksi Kain Raja Brukat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
