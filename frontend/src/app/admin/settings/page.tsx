"use client";

import { useState, useEffect } from "react";
import { Save, User, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:5000/api/users/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:5000/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Settings updated successfully!");
        localStorage.setItem("admin_token", data.token); // Store the new token
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Admin Settings</h1>
        <p className="text-gray-500">Update your email address and password for the admin portal.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSave} className="space-y-6 max-w-lg">
          
          <div>
            <label className="flex items-center text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">
              <Mail className="w-4 h-4 mr-2" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
              placeholder="admin@dragonworm.com"
            />
            <p className="text-xs text-gray-500 mt-2">
              If you change your email, the next time you log in, the OTP will be sent to this new email.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2" /> Change Password
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Leave these fields blank if you do not wish to change your password.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:border-black transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all rounded-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
