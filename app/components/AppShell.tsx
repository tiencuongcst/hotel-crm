"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserPanel from "./UserPanel";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/loyalty", label: "Loyalty" },
  { href: "/visitFrequency", label: "Visit Frequency" },
  { href: "/vouchers", label: "Vouchers" },
];

type Branding = {
  app_name?: string;
  company_name?: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>({
    app_name: "Hotel CRM",
    company_name: "Khánh Phát Investment",
  });

  useEffect(() => {
    async function loadBranding() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "app_branding")
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      if (!error && data?.setting_value) {
        setBranding(data.setting_value as Branding);
      }
    }

    loadBranding();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h1 className="text-lg font-bold tracking-tight text-slate-950">
            {branding.app_name ?? "Hotel CRM"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {branding.company_name ?? "Khánh Phát Investment"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <UserPanel />
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-auto">{children}</section>
    </div>
  );
}