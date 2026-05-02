import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type VisitFrequencyRow = {
  customer_identity: string;
  customer_name: string | null;
  phone: string | null;
  loyalty_stays: number | null;
  tier: string | null;
  first_stay: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
};

type UserPermission = {
  user_id: string;
  hotel: string | null;
  status: string | null;
};

function sanitizeText(value: string | null): string {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function parseHotelCodes(value: string | null): string[] | null {
  const rawValue = sanitizeText(value);

  if (!rawValue || rawValue.toUpperCase() === "ALL") return null;

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

async function getCurrentUserId(request: Request): Promise<string | null> {
  const cookieStore = await cookies();

  return (
    cookieStore.get(USER_COOKIE_KEY)?.value?.trim() ||
    request.headers.get("x-current-user-id")?.trim() ||
    request.headers.get("x-user-id")?.trim() ||
    null
  );
}

async function getUserPermission(userId: string): Promise<{
  user: UserPermission | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, hotel, status")
    .eq("user_id", userId)
    .maybeSingle()
    .returns<UserPermission>();

  if (error) return { user: null, error: error.message };

  if (!data || data.status !== "active") {
    return { user: null, error: "User not found or inactive" };
  }

  return { user: data, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, error: permissionError } =
      await getUserPermission(currentUserId);

    if (permissionError || !user) {
      return NextResponse.json(
        { error: permissionError ?? "Forbidden" },
        { status: 403 }
      );
    }

    const hotel = sanitizeText(searchParams.get("hotel")) || "ALL";
    const minStays = parsePositiveInteger(searchParams.get("stays"), 1);
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const allowedHotels = parseHotelCodes(user.hotel);
    const requestedHotels = hotel === "ALL" ? null : [hotel.toUpperCase()];
    const finalHotelCodes = mergeHotelAccess(allowedHotels, requestedHotels);

    if (allowedHotels !== null && finalHotelCodes?.length === 0) {
      return NextResponse.json({
        customers: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
          hasPreviousPage: page > 1,
          hasNextPage: false,
        },
      });
    }

    let allowedCustomerIdentities: string[] | null = null;

    if (finalHotelCodes !== null) {
      const { data: allowedStays, error: allowedStaysError } = await supabase
        .from("crm_customer_stays_snapshot")
        .select("customer_identity")
        .in("hotel_code", finalHotelCodes)
        .limit(50000);

      if (allowedStaysError) {
        return NextResponse.json(
          {
            error: "Failed to validate visit frequency access",
            details: allowedStaysError.message,
          },
          { status: 500 }
        );
      }

      allowedCustomerIdentities = Array.from(
        new Set(
          (allowedStays ?? [])
            .map((stay) => stay.customer_identity?.trim())
            .filter((customerIdentity): customerIdentity is string =>
              Boolean(customerIdentity)
            )
        )
      );

      if (allowedCustomerIdentities.length === 0) {
        return NextResponse.json({
          customers: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 1,
            hasPreviousPage: page > 1,
            hasNextPage: false,
          },
        });
      }
    }

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

    if (allowedCustomerIdentities !== null) {
      query = query.in("customer_identity", allowedCustomerIdentities);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to load visit frequency",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as VisitFrequencyRow[];

    return NextResponse.json({
      customers: rows,
      pagination: {
        page,
        pageSize,
        total: rows.length,
        totalPages: rows.length < pageSize ? page : page + 1,
        hasPreviousPage: page > 1,
        hasNextPage: rows.length === pageSize,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}