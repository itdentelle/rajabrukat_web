"use client";

import { motion } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  color: string;
  isActive: boolean;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/collections`)
      .then(res => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return [];
        return res.json();
      })
      .then(data => {
        // Filter out inactive collections
        setCollections(data.filter((c: Collection) => c.isActive));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching collections:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-stone-50 text-stone-900 pt-32 pb-24 text-center font-bold tracking-widest uppercase">Loading Collections...</div>;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-24 pb-0">
      <div className="container mx-auto px-4 mb-16">
        <Reveal>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 text-stone-900">Koleksi Raja Brukat</h1>
          <p className="text-stone-600 max-w-md font-medium">Koleksi kain brukat tile mutiara, renda Chantilly, dan cornely 3D eksklusif untuk momen istimewa Anda.</p>
        </Reveal>
      </div>

      <div className="flex flex-col">
        {collections.map((collection, idx) => (
          <div key={collection.id} className={`relative min-h-[70vh] flex items-center ${collection.color || 'bg-zinc-900'} overflow-hidden group`}>
            {/* Background Image with Parallax effect simulation */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors duration-700" />
              <img 
                src={collection.imageUrl || "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80"} 
                alt={collection.title}
                className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-1000"
              />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-20">
              <div className="max-w-xl">
                {collection.subtitle && (
                  <Reveal delay={0.2}>
                    <p className="text-sm font-bold uppercase tracking-widest mb-4 border-l-2 border-white pl-4">{collection.subtitle}</p>
                  </Reveal>
                )}
                <Reveal delay={0.3}>
                  <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
                    {collection.title}
                  </h2>
                </Reveal>
                {collection.description && (
                  <Reveal delay={0.4}>
                    <p className="text-lg text-gray-200 mb-8 leading-relaxed">
                      {collection.description}
                    </p>
                  </Reveal>
                )}
                <Reveal delay={0.5}>
                  <Link 
                    href="/shop" 
                    className="inline-block px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
                  >
                    Explore Collection
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="py-32 text-center">
            <h2 className="text-2xl font-bold text-gray-500 uppercase tracking-widest">No collections available yet.</h2>
          </div>
        )}
      </div>
    </div>
  );
}
