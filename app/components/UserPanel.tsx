"use client";

import { useEffect, useState } from "react";
import { clearCurrentUser, getCurrentUser, CurrentUser } from "@/lib/currentUser";

export default function UserPanel() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleLogout() {
    clearCurrentUser();
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Login
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="font-bold text-slate-950">{user.user_name}</div>
      <div className="mt-1 text-xs text-slate-500">
        Hotel: {user.is_admin ? "ALL" : user.hotel_codes?.join(", ")}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        Edit profile: {user.can_edit_customer_profile ? "Yes" : "No"}
      </div>

      <button
        onClick={handleLogout}
        className="mt-4 w-full rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
      >
        Logout
      </button>
    </div>
  );
}