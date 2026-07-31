"use client";

import { Reveal } from "@/components/ui/Reveal";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/config/hero")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error fetching config:", err));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-28">
        <Reveal>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8 text-stone-900">
            {config?.aboutPageTitle?.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br /></span>) || <><span key="1">Keanggunan</span><br /><span key="2">Kain Premium</span><br /><span key="3">Raja Brukat</span></>}
          </h1>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
          <Reveal delay={0.2}>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-[#b77305]">
              {config?.aboutPageStory1 || "Raja Brukat adalah destinasi utama Anda untuk mendapatkan kain brukat mewah, tile mutiara, renda Chantilly, dan furing silk bermutu tinggi."}
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="text-stone-600 leading-relaxed space-y-6">
              {(config?.aboutPageStory2 || "Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan puluhan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta pesta, seragam keluarga bridesmaid, hingga busana adat pernikahan.\\n\\nSetiap kain diproduksi dan dikurasi secara teliti dengan kerapatan bordir presisi, hiasan mutiara timbul, serta tekstur lembut yang nyaman dipakai sepanjang hari.").split('\\n\\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Visual Break */}
      <section className="w-full h-[50vh] md:h-[70vh] relative overflow-hidden bg-stone-950 my-12">
        <div className="absolute inset-0 bg-stone-950/40 z-10" />
        <img 
          src={config?.aboutPageImgUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80"} 
          alt="Raja Brukat Premium Fabric" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Reveal>
            <h2 className="text-[#b77305] text-4xl md:text-7xl font-black uppercase tracking-tighter text-center px-4 drop-shadow-md">
              {config?.aboutPageImgText || "Kemewahan Tanpa Kompromi."}
            </h2>
          </Reveal>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Reveal delay={0.1}>
            <div className="p-8 bg-[#b77305]/5 border border-[#b77305]/20 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-[#b77305]">{config?.aboutPagePhil1Title || "01. Kualitas Premium"}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{config?.aboutPagePhil1Desc || "Serat renda Chantilly dan tile pilihan yang lembut di kulit, tahan lama, dan tidak gatal."}</p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="p-8 bg-[#b77305]/5 border border-[#b77305]/20 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-[#b77305]">{config?.aboutPagePhil2Title || "02. Motif Anggun"}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{config?.aboutPagePhil2Desc || "Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang mewah untuk segala momen istimewa."}</p>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="p-8 bg-[#b77305]/5 border border-[#b77305]/20 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-[#b77305]">{config?.aboutPagePhil3Title || "03. Pelayanan Grosir & Eceran"}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{config?.aboutPagePhil3Desc || "Melayani pembelian meteran maupun roll besar untuk desainer, penjahit, dan seragam panitia acara."}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
