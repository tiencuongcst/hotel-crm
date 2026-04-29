import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

async function getBranding(): Promise<Branding> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", "app_branding")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data?.setting_value) {
    return {
      app_name: "Hotel CRM",
      company_name: "Khánh Phát Investment",
    };
  }

  return data.setting_value as Branding;
}

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white">
        <div className="border-b p-5">
          {/* 🔥 DYNAMIC FROM DB */}
          <h1 className="text-xl font-bold">
            {branding.app_name ?? "Hotel CRM"}
          </h1>
          <p className="text-sm text-gray-500">
            {branding.company_name ?? "Khánh Phát Investment"}
          </p>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="flex-1 overflow-auto">{children}</section>
    </div>
  );
}