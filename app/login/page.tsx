"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { saveCurrentUser } from "@/lib/currentUser";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

function setUserCookie(userId: string) {
  document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(
    userId
  )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId || !password) {
      setError("Vui lòng nhập user và password");
      return;
    }

    setLoading(true);
    setError("");

    const { data: rawUser, error: rawError } = await supabase
      .from("users")
      .select("user_id, password, status")
      .eq("user_id", normalizedUserId)
      .maybeSingle();

    if (
      rawError ||
      !rawUser ||
      rawUser.password !== password ||
      rawUser.status !== "active"
    ) {
      setError("Sai user hoặc password");
      setLoading(false);
      return;
    }

    const { data: user, error: userError } = await supabase
      .from("v_users")
      .select("*")
      .eq("user_id", normalizedUserId)
      .maybeSingle();

    if (userError || !user) {
      setError("User không active hoặc không có quyền");
      setLoading(false);
      return;
    }

    saveCurrentUser(user);
    setUserCookie(user.user_id);

    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold">Login</h2>

        <input
          placeholder="User ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleLogin();
          }}
          className="mb-3 w-full rounded-lg border px-3 py-2"
        />

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-black px-3 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
}