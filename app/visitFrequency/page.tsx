import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  const to = from + pageSize - 1;

  const { data: hotels } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true })
    .returns<HotelRow[]>();

  let query = supabase
    .from("v_loyal_customers")
    .select(
      `
      customer_identity,
      customer_name,
      phone,
      loyalty_stays,
      tier,
      first_stay,
      last_stay,
      hotel_codes
    `
    )
    .gte("loyalty_stays", minStays)
    .order("loyalty_stays", { ascending: true })
    .order("last_stay", { ascending: false })
    .range(from, to);

  if (hotel !== "ALL") {
    query = query.contains("hotel_codes", [hotel]);
  }

  const { data, error } = await query;
  const customers = (data ?? []) as VisitFrequencyCustomer[];

  const hasPreviousPage = page > 1;
  const hasNextPage = customers.length === pageSize;

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Failed to load Visit Frequency
        </h1>
        <p className="mt-2 text-slate-500">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Visit Frequency</h1>

      <form className="mb-4 mt-4 flex items-center gap-2">
        <label className="font-semibold">Hotel:</label>

        <select
          name="hotel"
          defaultValue={hotel}
          className="rounded border px-3 py-2"
        >
          <option value="ALL">ALL</option>

          {(hotels ?? []).map((hotelOption) => (
            <option key={hotelOption.hotel_code} value={hotelOption.hotel_code}>
              {hotelOption.hotel_code} - {hotelOption.hotel_name}
            </option>
          ))}
        </select>

        <label className="ml-4 font-semibold">Stays:</label>

        <select
          name="stays"
          defaultValue={String(minStays)}
          className="rounded border px-3 py-2"
        >
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="5">5+</option>
          <option value="10">10+</option>
        </select>

        <button type="submit" className="rounded border px-3 py-2">
          Apply
        </button>
      </form>

      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <div>
          Showing {customers.length === 0 ? 0 : from + 1} -{" "}
          {from + customers.length} customers
        </div>

        <div>
          Page {page}
          {hasNextPage ? " / more" : ""}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border">
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

      <div className="mt-4 flex items-center justify-end gap-3">
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
    </main>
  );
}