import {
  Activity,
  Crown,
  Hotel,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function MetricCard({
  title,
  value,
  icon,
  tone,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${tone}`}>{icon}</div>
      </div>

      <p className="mt-5 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function TierCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`h-3 w-3 rounded-full ${color}`} />
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function LineChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Total Stays Trend
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Booking activity overview
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          Last 6 periods
        </span>
      </div>

      <div className="h-72 rounded-2xl bg-slate-50 p-5">
        <svg viewBox="0 0 640 260" className="h-full w-full">
          <defs>
            <linearGradient id="stayLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#6366f1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[40, 90, 140, 190, 240].map((y) => (
            <line
              key={y}
              x1="40"
              y1={y}
              x2="610"
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="6 6"
            />
          ))}

          <path
            d="M50 205 C120 180, 150 170, 210 178 C270 186, 295 195, 340 140 C395 75, 455 105, 505 88 C550 72, 585 46, 610 36 L610 235 L50 235 Z"
            fill="url(#stayLineFill)"
          />

          <path
            d="M50 205 C120 180, 150 170, 210 178 C270 186, 295 195, 340 140 C395 75, 455 105, 505 88 C550 72, 585 46, 610 36"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {[
            [50, 205],
            [210, 178],
            [340, 140],
            [505, 88],
            [610, 36],
          ].map(([x, y]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="6"
              fill="#ffffff"
              stroke="#4f46e5"
              strokeWidth="4"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function DonutChart({ metrics }: { metrics: DashboardMetrics }) {
  const total =
    metrics.new_customers +
    metrics.silver_customers +
    metrics.gold_customers +
    metrics.platinum_customers;

  const segments = [
    { label: "New", value: metrics.new_customers, color: "#64748b" },
    { label: "Silver", value: metrics.silver_customers, color: "#94a3b8" },
    { label: "Gold", value: metrics.gold_customers, color: "#f59e0b" },
    { label: "Platinum", value: metrics.platinum_customers, color: "#6366f1" },
  ];

  let offset = 25;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Customer Tier Mix</h2>
      <p className="mt-1 text-sm text-slate-500">
        Customer distribution by tier
      </p>

      <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row">
        <div className="relative">
          <svg width="190" height="190" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="6"
            />

            {segments.map((segment) => {
              const percentage = total ? (segment.value / total) * 100 : 0;
              const currentOffset = offset;
              offset -= percentage;

              return (
                <circle
                  key={segment.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="6"
                  strokeDasharray={`${percentage} ${100 - percentage}`}
                  strokeDashoffset={currentOffset}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(total)}
            </p>
          </div>
        </div>

        <div className="w-full space-y-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium text-slate-600">
                  {segment.label}
                </span>
              </div>

              <span className="text-sm font-bold text-slate-900">
                {formatNumber(segment.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { data, error } = await supabase
    .from("v_dashboard_overview")
    .select(
      `
      total_customers,
      loyalty_customers,
      total_stays,
      loyalty_stays,
      new_customers,
      silver_customers,
      gold_customers,
      platinum_customers,
      loyalty_points
    `
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Dashboard error:", error);

    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load dashboard
        </div>
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
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Hotel CRM
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Overview of customer growth, loyalty performance and booking
              activity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-500">Current scope</p>
            <p className="text-lg font-bold text-slate-900">All Hotels</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Customers"
            value={metrics.total_customers}
            icon={<Users size={22} className="text-indigo-600" />}
            tone="bg-indigo-50"
            description="All unique customer identities"
          />

          <MetricCard
            title="Loyalty Customers"
            value={metrics.loyalty_customers}
            icon={<Crown size={22} className="text-amber-600" />}
            tone="bg-amber-50"
            description="Customers eligible for loyalty"
          />

          <MetricCard
            title="Total Stays"
            value={metrics.total_stays}
            icon={<Hotel size={22} className="text-indigo-600" />}
            tone="bg-indigo-50"
            description="Total stays across hotels"
          />

          <MetricCard
            title="Loyalty Stays"
            value={metrics.loyalty_stays}
            icon={<Sparkles size={22} className="text-emerald-600" />}
            tone="bg-emerald-50"
            description="Qualified stays for loyalty"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <TierCard
            title="New Customers"
            value={metrics.new_customers}
            color="bg-slate-500"
          />
          <TierCard
            title="Silver"
            value={metrics.silver_customers}
            color="bg-slate-400"
          />
          <TierCard
            title="Gold"
            value={metrics.gold_customers}
            color="bg-amber-500"
          />
          <TierCard
            title="Platinum"
            value={metrics.platinum_customers}
            color="bg-indigo-500"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <LineChart />
          </div>

          <DonutChart metrics={metrics} />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Activity className="text-indigo-600" size={22} />

              <div>
                <h2 className="font-bold text-slate-900">
                  Operational Insight
                </h2>
                <p className="text-sm text-slate-500">
                  Loyalty stays account for{" "}
                  <span className="font-semibold text-slate-900">
                    {metrics.total_stays
                      ? Math.round(
                          (metrics.loyalty_stays / metrics.total_stays) * 100
                        )
                      : 0}
                    %
                  </span>{" "}
                  of total stays.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}