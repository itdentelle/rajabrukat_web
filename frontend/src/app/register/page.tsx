"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, UserPlus, User, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useCartStore } from "@/store/cartStore";
import { API_BASE_URL } from "@/lib/api";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";

function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mergeCart = useCartStore((state) => state.mergeCart);

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: tokenResponse.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", "cookie_managed_token");
        localStorage.setItem("user", JSON.stringify(data.user));
        await mergeCart();
        toast.success("Pendaftaran Google berhasil! Selamat datang di Raja Brukat.");
        router.push("/profile");
      } else {
        const err = await res.json();
        setError(err.error || "Pendaftaran Google gagal");
        toast.error(err.error || "Pendaftaran Google gagal");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message === "OTP_REQUIRED") {
          setStep(2);
          toast.success("Kode OTP telah dikirim ke email Anda!");
        }
      } else {
        const err = await res.json();
        const errorMsg = err.error || "Pendaftaran gagal";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", "cookie_managed_token");
        localStorage.setItem("user", JSON.stringify(data.user));

        await mergeCart();

        toast.success("Pendaftaran berhasil! Selamat datang di Raja Brukat.");
        router.push("/profile");
      } else {
        const err = await res.json();
        const errorMsg = err.error || "Kode OTP tidak valid";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Left Panel - Image/Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[65%] relative bg-stone-900 items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.65 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/images/white_lace_hero.png"
            alt="Renda Chantilly Raja Brukat"
            fill
            priority
            className="object-cover object-center"
          />
        </motion.div>

        {/* White Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-950/40 z-10" />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-20 text-white text-center p-12 max-w-xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <Image
              src="/images/logo_rajabrukat-removebg-preview.png"
              alt="Logo Raja Brukat"
              fill
              className="object-contain"
            />
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tight mb-4 text-[#b77305]">
            RAJA BRUKAT
          </h1>
          <p className="text-stone-300 font-medium tracking-wide leading-relaxed text-base">
            Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan tentunya dengan harga yang terjangkau.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[35%] flex items-center justify-center p-8 sm:p-12 lg:p-14 bg-white relative shadow-2xl">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#b77305]/10 text-[#b77305] rounded-2xl mb-4 border border-[#b77305]/20 shadow-sm">
              <UserPlus className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-stone-900 mb-2">
              Daftar Akun Baru
            </h2>
            <p className="text-stone-500 text-sm font-normal">
              Isi data diri Anda untuk membuat akun di Raja Brukat.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-4 rounded-xl mb-6 text-center font-semibold"
            >
              {error}
            </motion.div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 ml-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 text-stone-900 p-3.5 pl-12 rounded-xl focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all text-sm font-medium"
                      placeholder="Siska Wijaya"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 ml-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 text-stone-900 p-3.5 pl-12 rounded-xl focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all text-sm font-medium"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 ml-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 text-stone-900 p-3.5 pl-12 rounded-xl focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 disabled:opacity-70 shadow-lg shadow-[#b77305]/20"
                >
                  {loading ? (
                    "Mendaftarkan..."
                  ) : (
                    <>
                      <span>Daftar Akun Sekarang</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] text-stone-400 font-bold uppercase tracking-widest whitespace-nowrap">
                  Atau
                </span>
                <div className="border-t border-stone-200 w-full"></div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Login gagal")}
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
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 ml-1">
                  Kode OTP 6 Digit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 p-4 pl-12 rounded-xl focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all font-bold tracking-[0.5em] text-center"
                    placeholder="------"
                  />
                </div>
                <p className="text-xs text-stone-500">
                  Kode OTP telah dikirimkan ke email: <span className="font-semibold">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all disabled:opacity-70 shadow-lg"
              >
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-stone-500">
              Sudah memiliki akun Raja Brukat?{" "}
              <Link
                href="/login"
                className="font-bold text-[#b77305] hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <RegisterForm />
    </GoogleOAuthProvider>
  );
}
