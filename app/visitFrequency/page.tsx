import Link from "next/link";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/app/components/ui/PageTitle";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    stays?: string;
    page?: string;
  }>;
};

type HotelRow = {
  hotel_code: string;
  hotel_name: string | null;
};

type VisitFrequencyCustomer = {
  customer_identity: string;
  customer_name: string | null;
  phone: string | null;
  loyalty_stays: number | null;
  tier: string | null;
  first_stay: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
};

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function buildVisitFrequencyUrl(params: {
  page: number;
  hotel: string;
  stays: number;
}): string {
  const query = new URLSearchParams();

  query.set("page", String(params.page));

  if (params.hotel && params.hotel !== "ALL") {
    query.set("hotel", params.hotel);
  }

  query.set("stays", String(params.stays));

  return `/visitFrequency?${query.toString()}`;
}

export default async function VisitFrequencyPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = params?.hotel ?? "ALL";
  const minStays = parsePositiveInteger(params?.stays, 1);
  const page = parsePositiveInteger(params?.page, 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  const { data: hotels } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true })
    .returns<HotelRow[]>();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const cookieHeader = headersList.get("cookie") ?? "";

  const apiUrl = new URL(`${protocol}://${host}/api/visitFrequency`);
  apiUrl.searchParams.set("hotel", hotel);
  apiUrl.searchParams.set("stays", String(minStays));
  apiUrl.searchParams.set("page", String(page));
  apiUrl.searchParams.set("limit", String(pageSize));

  const res = await fetch(apiUrl.toString(), {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    const result = await res.json().catch(() => null);

    return (
      <main className="p-6">
        <PageTitle>Failed to load Visit Frequency</PageTitle>
        <p className="mt-2 text-slate-500">
          {result?.details ?? result?.error ?? "Unknown error"}
        </p>
      </main>
    );
  }

  const result = await res.json();

  const customers = (result.customers ?? []) as VisitFrequencyCustomer[];
  const hasPreviousPage = Boolean(result.pagination?.hasPreviousPage);
  const hasNextPage = Boolean(result.pagination?.hasNextPage);

  return (
    <main className="min-h-screen bg-slate-50 px-6 pt-5 pb-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex items-center justify-between">
          <PageTitle>Visit Frequency</PageTitle>
        </header>

        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="text-sm font-semibold text-slate-700">Hotel:</label>

          <select
            name="hotel"
            defaultValue={hotel}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-[260px]"
          >
            <option value="ALL">ALL</option>

            {(hotels ?? []).map((hotelOption) => (
              <option key={hotelOption.hotel_code} value={hotelOption.hotel_code}>
                {hotelOption.hotel_code} - {hotelOption.hotel_name}
              </option>
            ))}
          </select>

          <select
            name="stays"
            defaultValue={String(minStays)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-[180px]"
          >
            <option value="1">1+ stays</option>
            <option value="2">2+ stays</option>
            <option value="3">3+ stays</option>
            <option value="5">5+ stays</option>
            <option value="10">10+ stays</option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            Apply
          </button>
        </form>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div>
            Showing {customers.length === 0 ? 0 : from + 1} -{" "}
            {from + customers.length} customers
          </div>

          <div>
            Page {page}
            {hasNextPage ? " / more" : ""}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">CRM ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Loyalty Stays</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">First Stay</th>
                <th className="px-4 py-3 text-left">Last Stay</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.customer_identity}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/customers/${customer.customer_identity}`}
                      className="text-blue-700 hover:underline"
                    >
                      {customer.customer_identity}
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${customer.customer_identity}`}
                      className="hover:underline"
                    >
                      {customer.customer_name ?? "-"}
                    </Link>
                  </td>

                  <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                  <td className="px-4 py-3">{customer.loyalty_stays ?? 0}</td>
                  <td className="px-4 py-3">{customer.tier ?? "-"}</td>
                  <td className="px-4 py-3">{customer.first_stay ?? "-"}</td>
                  <td className="px-4 py-3">{customer.last_stay ?? "-"}</td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={buildVisitFrequencyUrl({
              page: Math.max(1, page - 1),
              hotel,
              stays: minStays,
            })}
            className={`rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100 ${
              !hasPreviousPage ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Prev
          </Link>

          <span className="text-sm font-medium text-slate-600">Page {page}</span>

          <Link
            href={buildVisitFrequencyUrl({
              page: page + 1,
              hotel,
              stays: minStays,
            })}
            className={`rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100 ${
              !hasNextPage ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}