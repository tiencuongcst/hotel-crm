import {
  Crown,
  Medal,
  Sparkles,
  Trophy,
  Users,
  Hotel,
  Activity,
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
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {formatNumber(value)}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${tone}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs text-slate-400">{description}</p>
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

      <p className="mt-3 text-2xl font-bold text-slate-950">
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
          <h2 className="text-lg font-bold text-slate-950">
            Total Stays Trend
          </h2>
          <p className="text-sm text-slate-500">
            Booking activity overview
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Last 6 periods
        </span>
      </div>

      <div className="h-72 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-5">
        <svg viewBox="0 0 640 260" className="h-full w-full">
          <defs>
            <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M40 205 L150 175 L260 188 L370 120 L480 98 L600 48 L600 230 L40 230 Z"
            fill="url(#lineFill)"
          />

          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="40,205 150,175 260,188 370,120 480,98 600,48"
          />

          {[40, 150, 260, 370, 480, 600].map((x, index) => {
            const y = [205, 175, 188, 120, 98, 48][index];

            return (
              <circle
                key={x}
                cx={x}
                cy={y}
                r="6"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="4"
              />
            );
          })}
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
    { label: "Silver", value: metrics.silver_customers, color: "#cbd5e1" },
    { label: "Gold", value: metrics.gold_customers, color: "#f59e0b" },
    { label: "Platinum", value: metrics.platinum_customers, color: "#2563eb" },
  ];

  let offset = 25;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Customer Tier Mix</h2>
      <p className="text-sm text-slate-500">Customer distribution by tier</p>

      <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row">
        <div className="relative">
          <svg width="190" height="190" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#e5e7eb"
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
            <p className="text-xl font-bold text-slate-950">
              {formatNumber(total)}
            </p>
          </div>
        </div>

        <div className="w-full space-y-4">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
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

              <span className="text-sm font-bold text-slate-950">
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
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Hotel CRM
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Overview of customer growth, loyalty performance and booking activity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Current scope</p>
            <p className="font-semibold text-slate-950">All Hotels</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Customers"
            value={metrics.total_customers}
            icon={<Users size={22} className="text-blue-700" />}
            tone="bg-blue-50"
            description="All unique customer identities"
          />

          <MetricCard
            title="Loyalty Customers"
            value={metrics.loyalty_customers}
            icon={<Crown size={22} className="text-amber-700" />}
            tone="bg-amber-50"
            description="Customers eligible for loyalty"
          />

          <MetricCard
            title="Total Stays"
            value={metrics.total_stays}
            icon={<Hotel size={22} className="text-indigo-700" />}
            tone="bg-indigo-50"
            description="Total stays across hotels"
          />

          <MetricCard
            title="Loyalty Stays"
            value={metrics.loyalty_stays}
            icon={<Sparkles size={22} className="text-emerald-700" />}
            tone="bg-emerald-50"
            description="Qualified stays for loyalty"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <TierCard title="New Customers" value={metrics.new_customers} color="bg-slate-500" />
          <TierCard title="Silver" value={metrics.silver_customers} color="bg-slate-300" />
          <TierCard title="Gold" value={metrics.gold_customers} color="bg-amber-500" />
          <TierCard title="Platinum" value={metrics.platinum_customers} color="bg-blue-600" />
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
              <Activity className="text-blue-700" size={22} />
              <div>
                <h2 className="font-bold text-slate-950">Operational Insight</h2>
                <p className="text-sm text-slate-500">
                  Loyalty stays account for{" "}
                  <span className="font-semibold text-slate-950">
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