"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <Reveal>
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              Contact Us
            </h1>
            <p className="text-gray-500 text-lg max-w-xl">
              Have a question about an order, collaboration, or just want to say hi? Reach out to us below.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <Reveal delay={0.2}>
            <div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest mb-2">Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-black transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-black transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest mb-2">Subject</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-black transition-colors"
                    placeholder="Order Inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button 
                  type="button"
                  className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 hover:bg-gray-800 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="bg-gray-50 p-8 md:p-12 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Get In Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm mb-1">Email</h4>
                    <p className="text-gray-500">support@dragonworm.com</p>
                    <p className="text-gray-500">wholesale@dragonworm.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm mb-1">Studio</h4>
                    <p className="text-gray-500">Jl. Braga No. 123<br/>Bandung, West Java<br/>Indonesia 40111</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-200 mt-8">
                  <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Follow Us</h4>
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 bg-black text-white font-bold text-xs flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors">
                      IG
                    </a>
                    <a href="#" className="w-10 h-10 bg-black text-white font-bold text-xs flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors">
                      TW
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
