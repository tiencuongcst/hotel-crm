import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    search?: string;
    q?: string;
    page?: string;
  }>;
};

type HotelRow = {
  hotel_code: string;
  hotel_name: string | null;
};

type CustomerRow = {
  customer_identity: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  total_stays: number | null;
  loyalty_stays: number | null;
  tier: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
};

function sanitizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function getTierClass(tier: string | null): string {
  switch (tier) {
    case "platinum":
      return "bg-blue-100 text-blue-700";
    case "gold":
      return "bg-amber-100 text-amber-700";
    case "silver":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

function buildCustomersPageUrl(params: {
  page: number;
  search: string;
  hotel: string;
}): string {
  const query = new URLSearchParams();

  query.set("page", String(params.page));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.hotel && params.hotel !== "ALL") {
    query.set("hotel", params.hotel);
  }

  return `/customers?${query.toString()}`;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = sanitizeText(params?.hotel) || "ALL";
  const search = sanitizeText(params?.search ?? params?.q);
  const page = parsePositiveInteger(params?.page, 1);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const { data: hotelsData } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true })
    .returns<HotelRow[]>();

  const hotelCodes = hotel === "ALL" ? null : [hotel];

  const { data, error } = await supabase.rpc("search_customers_enriched", {
    input_search: search,
    input_hotel_codes: hotelCodes,
    input_limit: pageSize,
    input_offset: offset,
  });

  const customers = (data ?? []) as CustomerRow[];
  const hasPreviousPage = page > 1;
  const hasNextPage = customers.length === pageSize;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 font-sans text-[13px]">
        <h1 className="text-2xl font-bold text-red-600">
          Failed to load customers
        </h1>
        <p className="mt-2 text-slate-500">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-[13px]">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Customers
        </h1>
      </div>

      <form className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="font-semibold text-slate-800">Hotel:</label>

        <select
          name="hotel"
          defaultValue={hotel}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] outline-none lg:w-[260px]"
        >
          <option value="ALL">ALL</option>

          {(hotelsData ?? []).map((hotelOption) => (
            <option key={hotelOption.hotel_code} value={hotelOption.hotel_code}>
              {hotelOption.hotel_code} - {hotelOption.hotel_name ?? ""}
            </option>
          ))}
        </select>

        <input
          name="search"
          defaultValue={search}
          placeholder="Search customer..."
          className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-[13px] outline-none placeholder:text-slate-400"
        />

        <button
          type="submit"
          className="h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium hover:bg-slate-100"
        >
          Apply
        </button>
      </form>

      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <div>
          Showing {customers.length === 0 ? 0 : offset + 1} -{" "}
          {offset + customers.length} customers
        </div>

        <div>
          Page {page}
          {hasNextPage ? " / more" : ""}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-[13px]">
          <thead className="bg-slate-100">
            <tr className="text-left font-semibold text-slate-700">
              <th className="w-[180px] whitespace-nowrap px-5 py-4">CRM ID</th>
              <th className="w-[260px] px-4 py-4">Customer</th>
              <th className="w-[140px] px-4 py-4">Phone</th>
              <th className="w-[210px] px-4 py-4">Email</th>
              <th className="w-[105px] px-4 py-4 text-right">Total Stays</th>
              <th className="w-[115px] px-4 py-4 text-right">
                Loyalty Stays
              </th>
              <th className="w-[105px] px-4 py-4">Tier</th>
              <th className="w-[125px] px-4 py-4">Last Stay</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.customer_identity}
                className="border-t border-slate-200 transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-950">
                  <Link
                    href={`/customers/${customer.customer_identity}`}
                    className="hover:text-blue-700 hover:underline"
                  >
                    {customer.customer_identity}
                  </Link>
                </td>

                <td className="truncate px-4 py-4 font-medium text-slate-900">
                  <Link
                    href={`/customers/${customer.customer_identity}`}
                    className="hover:text-blue-700 hover:underline"
                  >
                    {customer.customer_name ?? "N/A"}
                  </Link>
                </td>

                <td className="truncate px-4 py-4 text-slate-700">
                  {customer.phone ?? "-"}
                </td>

                <td
                  className="truncate px-4 py-4 text-slate-600"
                  title={customer.email ?? ""}
                >
                  {customer.email ?? "-"}
                </td>

                <td className="px-4 py-4 text-right font-semibold text-slate-900">
                  {customer.total_stays ?? 0}
                </td>

                <td className="px-4 py-4 text-right font-semibold text-blue-700">
                  {customer.loyalty_stays ?? 0}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getTierClass(
                      customer.tier
                    )}`}
                  >
                    {customer.tier ?? "new"}
                  </span>
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {customer.last_stay ?? "-"}
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <Link
          href={buildCustomersPageUrl({
            page: Math.max(1, page - 1),
            search,
            hotel,
          })}
          className={`rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100 ${
            !hasPreviousPage ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Prev
        </Link>

        <span className="text-sm font-medium text-slate-600">
          Page {page}
        </span>

        <Link
          href={buildCustomersPageUrl({
            page: page + 1,
            search,
            hotel,
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