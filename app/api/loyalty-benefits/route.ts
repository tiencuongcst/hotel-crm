import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type UserPermission = {
  hotel: string | null;
  status: string | null;
};

function sanitizeText(value: string | null): string {
  return value?.trim() ?? "";
}

function parseHotelCodes(value: string | null | undefined): string[] | null {
  const rawValue = value?.trim() ?? "";

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

function escapeSearchValue(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function getCurrentUser(): Promise<UserPermission | null> {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get(USER_COOKIE_KEY)?.value?.trim();

  if (!currentUserId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("hotel, status")
    .eq("user_id", currentUserId)
    .maybeSingle()
    .returns<UserPermission>();

  if (error || !data || data.status !== "active") {
    return null;
  }

  return data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hotel = sanitizeText(searchParams.get("hotel")).toUpperCase();
    const active = sanitizeText(searchParams.get("active"));
    const search = sanitizeText(searchParams.get("search") ?? searchParams.get("q"));

    const allowedHotels = parseHotelCodes(currentUser.hotel);
    const requestedHotels = hotel && hotel !== "ALL" ? [hotel] : null;
    const finalHotelCodes = mergeHotelAccess(allowedHotels, requestedHotels);

    if (allowedHotels !== null && finalHotelCodes?.length === 0) {
      return NextResponse.json({
        loyaltyBenefits: [],
        message: "no permission",
      });
    }

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
        display_order,
        updated_at
      `);

    if (finalHotelCodes !== null) {
      query = query.in("hotel_code", ["ALL", ...finalHotelCodes]);
    }

    if (active.toLowerCase() === "true") {
      query = query.eq("active", true);
    }

    if (active.toLowerCase() === "false") {
      query = query.eq("active", false);
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

    const { data, error } = await query
      .order("display_order", { ascending: true })
      .order("hotel_code", { ascending: true })
      .order("tier", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          loyaltyBenefits: [],
          message: "Failed to load loyalty benefits",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      loyaltyBenefits: data ?? [],
      message: "success",
    });
  } catch (error) {
    return NextResponse.json(
      {
        loyaltyBenefits: [],
        message: "server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}