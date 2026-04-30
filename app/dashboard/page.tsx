import {
  Crown,
  Medal,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DashboardMetrics = {
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

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

/* ========================= */
/* METRIC CARD */
/* ========================= */

function MetricCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {formatNumber(value)}
          </p>
        </div>

        <div className={`rounded-lg p-2 ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

/* ========================= */
/* DONUT CHART */
/* ========================= */

function DonutChart({ metrics }: { metrics: DashboardMetrics }) {
  const total =
    metrics.new_customers +
    metrics.silver_customers +
    metrics.gold_customers +
    metrics.platinum_customers;

  const segments = [
    { label: "New", value: metrics.new_customers, color: "#94a3b8" },
    { label: "Silver", value: metrics.silver_customers, color: "#cbd5e1" },
    { label: "Gold", value: metrics.gold_customers, color: "#f59e0b" },
    { label: "Platinum", value: metrics.platinum_customers, color: "#2563eb" },
  ];

  let cumulative = 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">
        Customer Tier Mix
      </h2>

      <div className="mt-5 flex items-center gap-6">
        <svg width="150" height="150" viewBox="0 0 42 42">
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="5"
          />

          {segments.map((segment) => {
            const percentage = total
              ? (segment.value / total) * 100
              : 0;

            const dashOffset = 25 - cumulative;
            cumulative += percentage;

            return (
              <circle
                key={segment.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="5"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>

        <div className="space-y-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-600">{segment.label}</span>
              <span className="font-semibold text-slate-950">
                {formatNumber(segment.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================= */
/* LINE CHART */
/* ========================= */

function LineChartPlaceholder() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">
        Total Stays Trend
      </h2>

      <div className="mt-6 h-64 rounded-lg bg-slate-50 p-4">
        <svg viewBox="0 0 600 220" className="h-full w-full">
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            points="20,180 120,150 220,165 320,110 420,90 520,45"
          />
        </svg>
      </div>
    </div>
  );
}

/* ========================= */
/* PAGE */
/* ========================= */

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from("v_dashboard_overview")
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
    .maybeSingle();

  if (error) {
    console.error("Dashboard error:", error);

    return (
      <main className="p-6 text-red-500">
        Failed to load dashboard
      </main>
    );
  }

  const metrics: DashboardMetrics = data ?? {
    total_customers: 0,
    loyalty_customers: 0,
    total_stays: 0,
    loyalty_stays: 0,
    new_customers: 0,
    silver_customers: 0,
    gold_customers: 0,
    platinum_customers: 0,
    loyalty_points: 0,
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={metrics.total_customers}
          icon={<Users size={20} />}
          accent="bg-blue-50"
        />

        <MetricCard
          title="Loyalty Customers"
          value={metrics.loyalty_customers}
          icon={<Crown size={20} />}
          accent="bg-amber-50"
        />

        <MetricCard
          title="Total Stays"
          value={metrics.total_stays}
          icon={<Trophy size={20} />}
          accent="bg-indigo-50"
        />

        <MetricCard
          title="Loyalty Stays"
          value={metrics.loyalty_stays}
          icon={<Sparkles size={20} />}
          accent="bg-emerald-50"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LineChartPlaceholder />
        </div>

        <DonutChart metrics={metrics} />
      </section>
    </main>
  );
}