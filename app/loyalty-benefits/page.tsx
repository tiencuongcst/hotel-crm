import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { EmptyRow, Table, THead, TRow } from "@/app/components/ui/Table";
import PageTitle from "@/app/components/ui/PageTitle";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    search?: string;
    q?: string;
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

function escapeSearchValue(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
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

export default async function LoyaltyBenefitsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = sanitizeText(params?.hotel) || "ALL";
  const search = sanitizeText(params?.search ?? params?.q);

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
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
      <main className="min-h-screen bg-slate-50 px-6 pt-5 pb-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <header className="flex items-center justify-between">
            <PageTitle>Loyalty Benefits</PageTitle>
          </header>

          <Card>
            <div className="p-8 text-center text-slate-500">
              Không có quyền xem chính sách của khách sạn này.
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

  let query = supabase
    .from("loyalty_benefits")
    .select(`
      id,
      tier,
      condition,
      benefit_1,
      benefit_2,
      benefit_3,
      note,
      hotel_code,
      active,
      display_order
    `)
    .order("display_order", { ascending: true })
    .order("hotel_code", { ascending: true })
    .order("tier", { ascending: true });

  if (hotelCodes !== null) {
    query = query.in("hotel_code", ["ALL", ...hotelCodes]);
  }

  if (search) {
    const safeSearch = escapeSearchValue(search);

    query = query.or(
      [
        `tier.ilike.%${safeSearch}%`,
        `condition.ilike.%${safeSearch}%`,
        `benefit_1.ilike.%${safeSearch}%`,
        `benefit_2.ilike.%${safeSearch}%`,
        `benefit_3.ilike.%${safeSearch}%`,
        `note.ilike.%${safeSearch}%`,
        `hotel_code.ilike.%${safeSearch}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  const benefits = error ? [] : data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 pt-5 pb-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex items-center justify-between">
          <PageTitle>Loyalty Benefits</PageTitle>
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

          <Input
            name="search"
            defaultValue={search}
            placeholder="Search tier, benefit, hotel, note..."
            className="flex-1"
          />

          <Button type="submit">Apply</Button>
        </form>

        {error && (
          <Card>
            <div className="p-4 text-sm text-red-600">
              Failed to load loyalty benefits: {error.message}
            </div>
          </Card>
        )}

        <Card>
          <Table minWidth="1280px">
            <THead>
              <tr>
                <th className="w-[80px] px-5 py-4 text-left">Order</th>
                <th className="w-[120px] px-4 py-4 text-left">Tier</th>
                <th className="w-[260px] px-4 py-4 text-left">Condition</th>
                <th className="w-[360px] px-4 py-4 text-left">Benefit 1</th>
                <th className="w-[220px] px-4 py-4 text-left">Benefit 2</th>
                <th className="w-[260px] px-4 py-4 text-left">Benefit 3</th>
                <th className="w-[180px] px-4 py-4 text-left">Note</th>
                <th className="w-[100px] px-4 py-4 text-left">Hotel</th>
                <th className="w-[100px] px-4 py-4 text-left">Active</th>
              </tr>
            </THead>

            <tbody>
              {benefits.map((item: any) => (
                <TRow key={item.id}>
                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {item.display_order ?? 999}
                  </td>

                  <td className="px-4 py-4 font-semibold capitalize text-slate-950">
                    {item.tier ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.condition ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.benefit_1 ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.benefit_2 ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.benefit_3 ?? "-"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.note ?? "-"}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-950">
                    {item.hotel_code ?? "ALL"}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.active ? "TRUE" : "FALSE"}
                  </td>
                </TRow>
              ))}

              {benefits.length === 0 && (
                <EmptyRow colSpan={9}>No loyalty benefits found</EmptyRow>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </main>
  );
}