import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) {
    throw new Error("Missing request host");
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function getDashboardMetrics() {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/api/dashboard`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Dashboard API error:", res.status, await res.text());
      return { metrics: null };
    }

    return res.json();
  } catch (error) {
    console.error("Dashboard fetch failed:", error);
    return { metrics: null };
  }
}

function numberValue(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function formatNumber(value: number | null | undefined) {
  return numberValue(value).toLocaleString("vi-VN");
}

function Card({
  title,
  value,
}: {
  title: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <strong className="text-2xl">{formatNumber(value)}</strong>
    </div>
  );
}

export default async function DashboardPage() {
  const { metrics } = await getDashboardMetrics();

  if (!metrics) {
    return <div className="p-6">Failed to load dashboard</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Total Customers" value={metrics.total_customers} />
        <Card title="Loyalty Customers" value={metrics.loyalty_customers} />
        <Card title="Total Stays" value={metrics.total_stays} />
        <Card title="Loyalty Stays" value={metrics.loyalty_stays} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card title="New" value={metrics.new_customers} />
        <Card title="Silver" value={metrics.silver_customers} />
        <Card title="Gold" value={metrics.gold_customers} />
        <Card title="Platinum" value={metrics.platinum_customers} />
        <Card title="Points" value={metrics.loyalty_points} />
      </div>
    </div>
  );
}