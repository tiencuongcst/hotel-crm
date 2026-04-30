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
        className="block rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white"
      >
        Login
      </a>
    );
  }

  return (
    <div className="rounded-xl border bg-gray-50 p-3 text-sm">
      <div className="font-semibold text-gray-900">{user.user_name}</div>
      <div className="text-gray-500">
        Hotel: {user.is_admin ? "ALL" : user.hotel_codes?.join(", ")}
      </div>
      <div className="text-gray-500">
        Edit profile: {user.can_edit_customer_profile ? "Yes" : "No"}
      </div>

      <button
        onClick={handleLogout}
        className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}