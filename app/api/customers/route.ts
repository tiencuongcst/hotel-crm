import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type CustomerRow = {
  customer_identity: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  total_stays: number;
  loyalty_stays: number;
  tier: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
  car: string | null;
  customer_profile: string | null;
  total_count?: number;
};

type CustomerStayAccessRow = {
  customer_identity: string;
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

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function parseHotelCodes(value: string | null): string[] | null {
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
  if (allowedHotels === null) {
    return requestedHotels;
  }

  if (requestedHotels === null) {
    return allowedHotels;
  }

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

  if (error) {
    return { user: null, error: error.message };
  }

  if (!data || data.status !== "active") {
    return { user: null, error: "User not found or inactive" };
  }

  return { user: data, error: null };
}

async function getAccessibleCustomerIdentities(
  customerIdentities: string[],
  allowedHotels: string[] | null
): Promise<{
  identities: Set<string>;
  error: string | null;
}> {
  const uniqueCustomerIdentities = Array.from(
    new Set(
      customerIdentities
        .map((customerIdentity) => customerIdentity.trim())
        .filter(Boolean)
    )
  );

  if (allowedHotels === null) {
    return {
      identities: new Set(uniqueCustomerIdentities),
      error: null,
    };
  }

  if (uniqueCustomerIdentities.length === 0 || allowedHotels.length === 0) {
    return {
      identities: new Set(),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("crm_customer_stays_snapshot")
    .select("customer_identity")
    .in("customer_identity", uniqueCustomerIdentities)
    .in("hotel_code", allowedHotels)
    .limit(uniqueCustomerIdentities.length * 5)
    .returns<CustomerStayAccessRow[]>();

  if (error) {
    return {
      identities: new Set(),
      error: error.message,
    };
  }

  return {
    identities: new Set(
      (data ?? [])
        .map((stay) => stay.customer_identity?.trim())
        .filter((customerIdentity): customerIdentity is string =>
          Boolean(customerIdentity)
        )
    ),
    error: null,
  };
}

export async function GET(request: Request) {
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

    const search = sanitizeText(
      searchParams.get("search") ?? searchParams.get("q")
    );

    const tier = sanitizeText(searchParams.get("tier"));
    const month = sanitizeText(searchParams.get("month"));

    const requestedHotels = parseHotelCodes(
      searchParams.get("hotelCodes") ?? searchParams.get("hotel")
    );

    const allowedHotels = parseHotelCodes(user.hotel);
    const finalHotelCodes = mergeHotelAccess(allowedHotels, requestedHotels);

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    if (allowedHotels !== null && finalHotelCodes?.length === 0) {
      return NextResponse.json({
        customers: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    const offset = (page - 1) * pageSize;

    const { data, error } = await supabase.rpc("search_customers_enriched", {
      input_search: search,
      input_hotel_codes: finalHotelCodes,
      input_tier: tier && tier !== "all" ? tier : null,
      input_stay_month: month || null,
      input_limit: pageSize,
      input_offset: offset,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to load customers",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as CustomerRow[];

    const { identities: accessibleCustomerIdentities, error: accessError } =
      await getAccessibleCustomerIdentities(
        rows.map((row) => row.customer_identity),
        allowedHotels
      );

    if (accessError) {
      return NextResponse.json(
        {
          error: "Failed to validate customer access",
          details: accessError,
        },
        { status: 500 }
      );
    }

    const filteredRows =
      allowedHotels === null
        ? rows
        : rows.filter((row) =>
            accessibleCustomerIdentities.has(row.customer_identity)
          );

    const total = filteredRows[0]?.total_count ?? filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const customers = filteredRows.map(({ total_count, ...customer }) => customer);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
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