"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { saveCurrentUser } from "@/lib/currentUser";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");

    // 1. Check password từ table users
    const { data: rawUser, error: rawError } = await supabase
      .from("users")
      .select("user_id, password")
      .eq("user_id", userId)
      .single();

    if (rawError || !rawUser || rawUser.password !== password) {
      setError("Sai user hoặc password");
      setLoading(false);
      return;
    }

    // 2. Lấy permission từ v_users
    const { data: user, error: userError } = await supabase
      .from("v_users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      setError("User không active hoặc không có quyền");
      setLoading(false);
      return;
    }

    // 3. Lưu vào localStorage
    saveCurrentUser(user);

    // 4. Redirect
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold">Login</h2>

        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2"
        />

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-black px-3 py-2 text-white hover:bg-gray-800"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
}