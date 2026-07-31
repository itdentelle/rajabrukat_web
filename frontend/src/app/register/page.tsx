"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, UserPlus, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import { useCartStore } from "@/store/cartStore";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mergeCart = useCartStore(state => state.mergeCart);

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: tokenResponse.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", "cookie_managed_token");
        localStorage.setItem("user", JSON.stringify(data.user));
        await mergeCart();
        toast.success("Google Registration successful! Welcome to Raja Brukat.");
        router.push("/profile");
      } else {
        const err = await res.json();
        setError(err.error || "Google registration failed");
        toast.error(err.error || "Google registration failed");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message === "OTP_REQUIRED") {
          setStep(2);
          toast.success("OTP sent to your email!");
        }
      } else {
        const err = await res.json();
        const errorMsg = err.error || "Registration failed";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", "cookie_managed_token");
        localStorage.setItem("user", JSON.stringify(data.user));
        
        await mergeCart();

        toast.success("Registration successful! Welcome to DragonWorm.");
        router.push("/profile");
      } else {
        const err = await res.json();
        const errorMsg = err.error || "Invalid OTP";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image/Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[70%] relative bg-black items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1550614000-4b95d4662134?q=80&w=2000" 
            alt="Urban Streetwear" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-20 text-white text-center p-12"
        >
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">Join The Movement</h1>
          <p className="text-gray-300 font-medium tracking-wide max-w-md mx-auto">
            Become a part of DragonWorm. Unlock exclusive drops, member-only perks, and unparalleled style.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[30%] flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-6 shadow-lg shadow-black/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Create Account</h2>
            <p className="text-gray-500 font-medium">Join us and start your journey today.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 text-center font-bold"
            >
              {error}
            </motion.div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-black p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-black p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-black p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all rounded-xl disabled:opacity-70 shadow-lg shadow-black/20"
                >
                  {loading ? (
                    "Creating Account..."
                  ) : (
                    <>
                      Register Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Or</span>
                <div className="border-t border-gray-200 w-full"></div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Login failed")}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="continue_with"
                />
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">6-Digit OTP Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-black p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium tracking-[0.5em] text-center"
                    placeholder="------"
                  />
                </div>
                <p className="text-xs text-gray-500">We've sent a 6-digit code to {email}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all rounded-xl disabled:opacity-70 shadow-lg shadow-black/20"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-black text-black hover:underline underline-offset-4">
                Login here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
