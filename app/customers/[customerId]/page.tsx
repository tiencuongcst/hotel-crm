import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Hotel,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import CustomerNotesForm from "./CustomerNotesForm";

type PageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

type Stay = {
  stay_id: string;
  booking_code: string | null;
  hotel_code: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
};

type CurrentUser = {
  hotel: string | null;
  edit_customer_profile: boolean | string | null;
};

function canEditCustomerProfile(user: CurrentUser | null | undefined) {
  return (
    user?.edit_customer_profile === true ||
    String(user?.edit_customer_profile).trim().toUpperCase() === "TRUE"
  );
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("vi-VN");
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "G";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function InfoCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </div>

      <div
        className={
          isEmpty
            ? "text-sm font-medium text-slate-400"
            : highlight
              ? "text-2xl font-bold text-slate-950"
              : "text-base font-semibold text-slate-950"
        }
      >
        {isEmpty ? "N/A" : value}
      </div>
    </div>
  );
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;

  if (!customerId) return notFound();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const cookieHeader = headersList.get("cookie") ?? "";

  const res = await fetch(`${protocol}://${host}/api/customers/${customerId}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!res.ok) return notFound();

  const result = await res.json();

  const customer = result.customer;
  const stays: Stay[] = result.stays ?? [];
  const user: CurrentUser | null = result.user ?? null;

  if (!customer) return notFound();

  const canEdit = canEditCustomerProfile(user);

  const sortedStays = [...stays].sort(
    (a, b) =>
      new Date(b.check_in_date ?? "").getTime() -
      new Date(a.check_in_date ?? "").getTime()
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
                {getInitials(customer.customer_name)}
              </div>

              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950">
                  {customer.customer_name} ({customer.customer_identity})
                </h1>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-800">
                    {customer.tier ?? "N/A"}
                  </span>

                  {(customer.hotel_codes ?? []).map((hotelCode: string) => (
                    <span
                      key={hotelCode}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-800"
                    >
                      {hotelCode}
                    </span>
                  ))}

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {customer.total_stays ?? 0} stays
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={<Phone size={16} />}
              label="Phone"
              value={customer.phone}
            />
            <InfoCard
              icon={<Mail size={16} />}
              label="Email"
              value={customer.email}
            />
            <InfoCard
              icon={<Trophy size={16} />}
              label="Total Stays"
              value={customer.total_stays}
              highlight
            />
            <InfoCard
              icon={<Sparkles size={16} />}
              label="Loyalty Stays"
              value={customer.loyalty_stays}
              highlight
            />
            <InfoCard
              icon={<CalendarDays size={16} />}
              label="First Stay"
              value={formatDate(customer.first_stay)}
            />
            <InfoCard
              icon={<CalendarDays size={16} />}
              label="Last Stay"
              value={formatDate(customer.last_stay)}
            />
            <InfoCard
              icon={<ShieldCheck size={16} />}
              label="Identity Source"
              value={customer.identity_source}
            />
            <InfoCard
              icon={<Hotel size={16} />}
              label="Hotels"
              value={customer.hotel_codes?.join(", ")}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <CustomerNotesForm
              customerId={customer.customer_identity}
              defaultCar={customer.car ?? null}
              defaultProfile={customer.customer_profile ?? null}
              canEdit={canEdit}
              compact
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">
              Booking History
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {sortedStays.length} bookings
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Booking Code</th>
                  <th className="px-4 py-3 text-left">Hotel</th>
                  <th className="px-4 py-3 text-left">Check-in</th>
                  <th className="px-4 py-3 text-left">Check-out</th>
                </tr>
              </thead>

              <tbody>
                {sortedStays.map((stay) => (
                  <tr
                    key={stay.stay_id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {displayValue(stay.booking_code)}
                    </td>
                    <td className="px-4 py-3">{displayValue(stay.hotel_code)}</td>
                    <td className="px-4 py-3">
                      {formatDate(stay.check_in_date)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(stay.check_out_date)}
                    </td>
                  </tr>
                ))}

                {sortedStays.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Chưa có booking history
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}