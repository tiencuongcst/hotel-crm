import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyRow, Table, THead, TRow } from "@/app/components/ui/Table";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    search?: string;
    q?: string;
    page?: string;
    month?: string;
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

type CurrentUser = {
  hotel: string | null;
  status: string | null;
};

function sanitizeText(value: string | undefined | null): string {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function parseHotelCodes(value: string | null | undefined): string[] | null {
  const rawValue = sanitizeText(value);

  if (!rawValue || rawValue.toUpperCase() === "ALL") {
    return null;
  }

  const hotelCodes = rawValue
    .split(",")
    .map((hotelCode) => hotelCode.trim().toUpperCase())
    .filter(Boolean);

  return hotelCodes.length > 0 ? hotelCodes : [];
}

function mergeHotelAccess(
  allowedHotels: string[] | null,
  requestedHotels: string[] | null
): string[] | null {
  if (allowedHotels === null) return requestedHotels;
  if (requestedHotels === null) return allowedHotels;

  return requestedHotels.filter((hotelCode) =>
    allowedHotels.includes(hotelCode)
  );
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
  month: string;
}): string {
  const query = new URLSearchParams();

  query.set("page", String(params.page));

  if (params.search) query.set("search", params.search);
  if (params.hotel && params.hotel !== "ALL") query.set("hotel", params.hotel);
  if (params.month) query.set("month", params.month);

  return `/customers?${query.toString()}`;
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get(USER_COOKIE_KEY)?.value?.trim();

  if (!currentUserId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("hotel, status")
    .eq("user_id", currentUserId)
    .maybeSingle()
    .returns<CurrentUser>();

  if (error || !data || data.status !== "active") {
    return null;
  }

  return data;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = sanitizeText(params?.hotel) || "ALL";
  const search = sanitizeText(params?.search ?? params?.q);
  const month = sanitizeText(params?.month);
  const page = parsePositiveInteger(params?.page, 1);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-2 text-slate-500">
          Không tìm thấy user hoặc user không active.
        </p>
      </main>
    );
  }

  const allowedHotels = parseHotelCodes(currentUser.hotel);
  const requestedHotels = hotel === "ALL" ? null : [hotel.toUpperCase()];
  const hotelCodes = mergeHotelAccess(allowedHotels, requestedHotels);

  if (allowedHotels !== null && hotelCodes?.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Customers
            </h1>
          </header>

          <Card>
            <div className="p-8 text-center text-slate-500">
              Không có quyền xem khách hàng của khách sạn này.
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const { data: hotelsData } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true })
    .returns<HotelRow[]>();

  const visibleHotels =
    allowedHotels === null
      ? hotelsData ?? []
      : (hotelsData ?? []).filter((hotelOption) =>
          allowedHotels.includes(hotelOption.hotel_code.trim().toUpperCase())
        );

  const { data, error } = await supabase.rpc("search_customers_enriched", {
    input_search: search,
    input_hotel_codes: hotelCodes,
    input_stay_month: month || null,
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

            {visibleHotels.map((hotelOption) => (
              <option key={hotelOption.hotel_code} value={hotelOption.hotel_code}>
                {hotelOption.hotel_code} - {hotelOption.hotel_name ?? ""}
              </option>
            ))}
          </Select>

          <div className="relative w-full lg:w-[180px]">
            <Input
              name="month"
              type="month"
              defaultValue={month}
              className={`w-full ${!month ? "text-transparent" : ""}`}
            />

            {!month && (
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                All time stay
              </span>
            )}
          </div>

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
                <th className="w-[105px] px-4 py-4 text-right">Total Stays</th>
                <th className="w-[115px] px-4 py-4 text-right">
                  Loyalty Stays
                </th>
                <th className="w-[120px] px-4 py-4 text-left">Tier</th>
                <th className="w-[140px] px-4 py-4 text-left">Last Stay</th>
                <th className="w-[180px] px-4 py-4 text-left">Hotels</th>
              </tr>
            </THead>

            <tbody>
              {customers.map((customer) => (
                <TRow key={customer.customer_identity}>
                  <td className="px-5 py-4 font-semibold text-blue-700">
                    <Link href={`/customers/${customer.customer_identity}`}>
                      {customer.customer_identity}
                    </Link>
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {customer.customer_name ?? "N/A"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {customer.phone ?? "N/A"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {customer.email ?? "N/A"}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold">
                    {customer.total_stays ?? 0}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold">
                    {customer.loyalty_stays ?? 0}
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant={getTierVariant(customer.tier)}>
                      {customer.tier ?? "N/A"}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {customer.last_stay ?? "N/A"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {customer.hotel_codes?.join(", ") ?? "N/A"}
                  </td>
                </TRow>
              ))}

              {customers.length === 0 && (
                <EmptyRow colSpan={9}>No customers found</EmptyRow>
              )}
            </tbody>
          </Table>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {hasPreviousPage && (
            <Link
              href={buildCustomersPageUrl({
                page: page - 1,
                search,
                hotel,
                month,
              })}
            >
              <Button type="button">Previous</Button>
            </Link>
          )}

          {hasNextPage && (
            <Link
              href={buildCustomersPageUrl({
                page: page + 1,
                search,
                hotel,
                month,
              })}
            >
              <Button type="button">Next</Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}