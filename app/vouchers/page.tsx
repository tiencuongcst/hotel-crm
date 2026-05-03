import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/app/components/ui/PageTitle";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
  }>;
};

type HotelRow = {
  hotel_code: string;
  hotel_name: string | null;
};

type CurrentUser = {
  hotel: string | null;
  status: string | null;
};

function sanitizeText(value: string | undefined | null): string {
  return value?.trim() ?? "";
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

export default async function VouchersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hotel = sanitizeText(params?.hotel) || "ALL";

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="p-6">
        <PageTitle>Unauthorized</PageTitle>
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
      <main className="p-6">
        <header className="flex items-center justify-between">
          <PageTitle>Vouchers</PageTitle>
        </header>

        <div className="mt-4 rounded-lg border bg-white p-8 text-center text-slate-500">
          Không có quyền xem voucher của khách sạn này.
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

  let query = supabase
    .from("v_vouchers")
    .select(`
      voucher_id,
      voucher_code,
      customer_name,
      phone_number,
      hotel_code,
      discount_type,
      discount_value,
      valid_from,
      valid_to,
      status,
      note
    `)
    .order("valid_to", { ascending: false })
    .limit(100);

  if (hotelCodes !== null) {
    query = query.in("hotel_code", hotelCodes);
  }

  const { data, error } = await query;
  const vouchers = error ? [] : data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 pt-5 pb-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex items-center justify-between">
          <PageTitle>Vouchers</PageTitle>
        </header>

        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="text-sm font-semibold text-slate-700">Hotel:</label>

          <select
            name="hotel"
            defaultValue={hotel}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-[260px]"
          >
            <option value="ALL">ALL</option>

            {visibleHotels.map((h) => (
              <option key={h.hotel_code} value={h.hotel_code}>
                {h.hotel_code} - {h.hotel_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            Apply
          </button>
        </form>

        {error && (
          <div className="rounded-lg border bg-white p-4 text-sm text-red-600">
            Failed to load vouchers: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Voucher</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Hotel</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Valid</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Note</th>
              </tr>
            </thead>

            <tbody>
              {vouchers.map((v: any) => (
                <tr key={v.voucher_id ?? v.voucher_code} className="border-t">
                  <td className="px-4 py-3 font-semibold">
                    {v.voucher_code ?? "-"}
                  </td>
                  <td className="px-4 py-3">{v.customer_name ?? "-"}</td>
                  <td className="px-4 py-3">{v.phone_number ?? "-"}</td>
                  <td className="px-4 py-3">{v.hotel_code ?? "-"}</td>
                  <td className="px-4 py-3">
                    {v.discount_type === "percent"
                      ? `${v.discount_value ?? 0}%`
                      : Number(v.discount_value ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.valid_from ?? "-"} → {v.valid_to ?? "-"}
                  </td>
                  <td className="px-4 py-3">{v.status ?? "-"}</td>
                  <td className="px-4 py-3">{v.note ?? "-"}</td>
                </tr>
              ))}

              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No vouchers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}