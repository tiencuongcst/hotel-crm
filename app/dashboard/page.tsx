import { createClient } from "@supabase/supabase-js";

type Metrics = {
  total_customers: number;
  loyalty_customers: number;
  total_stays: number;
  loyalty_stays: number;
  new_customers: number;
  silver_customers: number;
  gold_customers: number;
  platinum_customers: number;
  loyalty_points: number;
};

function numberValue(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function formatNumber(value: number | null | undefined) {
  return numberValue(value).toLocaleString("vi-VN");
}

function Card({ title, value }: { title: string; value: number | null | undefined }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <strong className="text-2xl">{formatNumber(value)}</strong>
    </div>
  );
}

async function getDashboardMetrics(): Promise<Metrics | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("dashboard_metrics") // 👈 VIEW trong DB
    .select(`
      total_customers,
      loyalty_customers,
      total_stays,
      loyalty_stays,
      new_customers,
      silver_customers,
      gold_customers,
      platinum_customers,
      loyalty_points
    `)
    .limit(1)
    .single();

  if (error) {
    console.error("Dashboard fetch error:", error);
    return null;
  }

  return data;
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

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