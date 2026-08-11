"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // OTP States
  const [requireOtp, setRequireOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message === "OTP_REQUIRED") {
          setRequireOtp(true);
        } else {
          localStorage.setItem("admin_token", data.token);
          router.push("/admin");
        }
      } else {
        const err = await res.json();
        setError(err.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
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
        localStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        const err = await res.json();
        setError(err.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
            <Lock className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-black uppercase tracking-tighter mb-8">
          Admin Portal
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-6 text-center">
            {error}
          </div>
        )}

        {!requireOtp ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                placeholder="admin@rajabrukat.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all rounded-md disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm text-center mb-6">
              A 6-digit OTP has been sent to <b>{email}</b>. Please check your terminal or email.
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Enter OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors text-center text-2xl tracking-[0.5em]"
                placeholder="123456"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all rounded-md disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
