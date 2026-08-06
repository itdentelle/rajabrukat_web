import CatalogFlipbookSection from "@/components/home/CatalogFlipbookSection";

export const metadata = {
  title: "Katalog Digital Interaktif Fullscreen | Raja Brukat",
  description: "Eksplor koleksi lengkap kain brukat, renda Chantilly, dan tulle timbul 3D dalam tampilan katalog digital interaktif full screen.",
};

export default function FullscreenCatalogPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-white">
      <CatalogFlipbookSection initialFullscreen={true} />
    </main>
  );
}
