import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyRow, Table, THead, TRow } from "@/app/components/ui/Table";

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

function getTierVariant(tier: string | null) {
  switch (tier) {
    case "platinum":
      return "platinum";
    case "gold":
      return "gold";
    case "silver":
      return "silver";
    default:
      return "default";
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
      <main className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Failed to load customers
        </h1>
        <p className="mt-2 text-slate-500">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Customers
          </h1>
        </header>

        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="text-sm font-semibold text-slate-700">Hotel:</label>

          <Select name="hotel" defaultValue={hotel} className="w-full lg:w-[260px]">
            <option value="ALL">ALL</option>

            {(hotelsData ?? []).map((hotelOption) => (
              <option key={hotelOption.hotel_code} value={hotelOption.hotel_code}>
                {hotelOption.hotel_code} - {hotelOption.hotel_name ?? ""}
              </option>
            ))}
          </Select>

          <Input
            name="search"
            defaultValue={search}
            placeholder="Search customer..."
            className="flex-1"
          />

          <Button type="submit">Apply</Button>
        </form>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div>
            Showing {customers.length === 0 ? 0 : offset + 1} -{" "}
            {offset + customers.length} customers
          </div>

          <div>
            Page {page}
            {hasNextPage ? " / more" : ""}
          </div>
        </div>

        <Card>
          <Table minWidth="1120px">
            <THead>
              <tr>
                <th className="w-[180px] whitespace-nowrap px-5 py-4 text-left">
                  CRM ID
                </th>
                <th className="w-[260px] px-4 py-4 text-left">Customer</th>
                <th className="w-[140px] px-4 py-4 text-left">Phone</th>
                <th className="w-[210px] px-4 py-4 text-left">Email</th>
                <th className="w-[105px] px-4 py-4 text-right">
                  Total Stays
                </th>
                <th className="w-[115px] px-4 py-4 text-right">
                  Loyalty Stays
                </th>
                <th className="w-[105px] px-4 py-4 text-left">Tier</th>
                <th className="w-[125px] px-4 py-4 text-left">Last Stay</th>
              </tr>
            </THead>

            <tbody>
              {customers.map((customer) => (
                <TRow key={customer.customer_identity}>
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
                    {customer.phone ? (
                      customer.phone
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>

                  <td
                    className="truncate px-4 py-4 text-slate-600"
                    title={customer.email ?? ""}
                  >
                    {customer.email ? (
                      customer.email
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-900">
                    {customer.total_stays ?? 0}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-blue-700">
                    {customer.loyalty_stays ?? 0}
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant={getTierVariant(customer.tier)}>
                      {customer.tier ?? "new"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {customer.last_stay ?? "-"}
                  </td>
                </TRow>
              ))}

              {customers.length === 0 && (
                <EmptyRow colSpan={8}>No customers found</EmptyRow>
              )}
            </tbody>
          </Table>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={buildCustomersPageUrl({
              page: Math.max(1, page - 1),
              search,
              hotel,
            })}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 ${
              !hasPreviousPage ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Prev
          </Link>

          <span className="text-sm font-medium text-slate-600">Page {page}</span>

          <Link
            href={buildCustomersPageUrl({
              page: page + 1,
              search,
              hotel,
            })}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 ${
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