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

function escapeSearchValue(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }
  return parsedValue;
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

    const search = sanitizeText(searchParams.get("search"));
    const hotel = sanitizeText(searchParams.get("hotel")).toUpperCase();
    const status = sanitizeText(searchParams.get("status"));

    const allowedHotels = parseHotelCodes(currentUser.hotel);
    const requestedHotels = hotel && hotel !== "ALL" ? [hotel] : null;
    const finalHotelCodes = mergeHotelAccess(allowedHotels, requestedHotels);

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    if (allowedHotels !== null && finalHotelCodes?.length === 0) {
      return NextResponse.json({
        vouchers: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
        },
        message: "no permission",
      });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("v_vouchers")
      .select(
        [
          "voucher_id",
          "voucher_code",
          "voucher_name",
          "customer_name",
          "phone_number",
          "phone_key",
          "customer_identity",
          "hotel_code",
          "discount_type",
          "discount_value",
          "valid_from",
          "valid_to",
          "status",
          "created_at",
        ].join(","),
        { count: "exact" }
      );

    if (finalHotelCodes !== null) {
      query = query.in("hotel_code", finalHotelCodes);
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (search) {
      const keywords = Array.from(
        new Set(
          [
            search,
            ...search
              .split(/\s+/)
              .map((keyword) => keyword.trim())
              .filter(Boolean),
          ].filter(Boolean)
        )
      );

      const orFilters = keywords.flatMap((keyword) => {
        const safe = escapeSearchValue(keyword);

        return [
          `voucher_code.ilike.%${safe}%`,
          `voucher_name.ilike.%${safe}%`,
          `customer_name.ilike.%${safe}%`,
          `phone_number.ilike.%${safe}%`,
          `customer_identity.ilike.%${safe}%`,
          `hotel_code.ilike.%${safe}%`,
        ];
      });

      query = query.or(orFilters.join(","));
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        {
          vouchers: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
          message: "Failed to load vouchers",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vouchers: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
      message: "success",
    });
  } catch (error) {
    return NextResponse.json(
      {
        vouchers: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 0,
        },
        message: "server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}