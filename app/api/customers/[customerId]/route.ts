import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const USER_COOKIE_KEY = "hotel_crm_current_user_id";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

type Customer = {
  customer_identity: string;
  identity_key: string | null;
  customer_name: string | null;
  phone: string | null;
  phone_key: string | null;
  email: string | null;
  total_stays: number;
  loyalty_stays: number;
  tier: string | null;
  tier_priority: number | null;
  identity_source: string | null;
  is_loyalty_eligible: boolean | null;
  first_stay: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
  source_customer_ids: string[] | null;
  updated_at: string | null;
  source_car: string | null;
  source_customer_profile: string | null;
};

type CustomerStay = {
  stay_id: string;
  source_customer_id: string | null;
  customer_identity: string;
  customer_name: string | null;
  normalized_phone: string | null;
  phone_key: string | null;
  normalized_email: string | null;
  booking_code: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  hotel_code: string | null;
  identity_source: string | null;
  is_loyalty_eligible: boolean | null;
};

type CustomerNote = {
  car: string | null;
  customer_profile: string | null;
};

type UserPermission = {
  user_id: string;
  hotel: string | null;
  status: string | null;
  edit_customer_profile: boolean | string | null;
};

function parseHotelCodes(value: string | null): string[] | null {
  if (!value || value.trim().toUpperCase() === "ALL") {
    return null;
  }

  const hotelCodes = value
    .split(",")
    .map((hotelCode) => hotelCode.trim().toUpperCase())
    .filter(Boolean);

  return hotelCodes.length > 0 ? hotelCodes : [];
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
    .select("user_id, hotel, status, edit_customer_profile")
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

export async function GET(request: Request, context: RouteContext) {
  try {
    const { customerId } = await context.params;
    const normalizedCustomerId = decodeURIComponent(customerId ?? "").trim();

    if (!normalizedCustomerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

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

    const allowedHotels = parseHotelCodes(user.hotel);

    const { data: customer, error: customerError } = await supabase
      .from("v_crm_customers_enriched")
      .select(`
        customer_identity,
        identity_key,
        customer_name,
        phone,
        phone_key,
        email,
        total_stays,
        loyalty_stays,
        tier,
        tier_priority,
        identity_source,
        is_loyalty_eligible,
        first_stay,
        last_stay,
        hotel_codes,
        source_customer_ids,
        updated_at,
        source_car,
        source_customer_profile
      `)
      .eq("customer_identity", normalizedCustomerId)
      .maybeSingle()
      .returns<Customer>();

    if (customerError) {
      return NextResponse.json(
        { error: "Failed to load customer", details: customerError.message },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found", customerId: normalizedCustomerId },
        { status: 404 }
      );
    }

    const { data: customerNote, error: customerNoteError } = await supabase
      .from("crm_customer_notes")
      .select("car, customer_profile")
      .eq("customer_identity", normalizedCustomerId)
      .maybeSingle()
      .returns<CustomerNote>();

    if (customerNoteError) {
      return NextResponse.json(
        {
          error: "Failed to load customer notes",
          details: customerNoteError.message,
        },
        { status: 500 }
      );
    }

    let staysQuery = supabase
      .from("crm_customer_stays_snapshot")
      .select(`
        stay_id,
        source_customer_id,
        customer_identity,
        customer_name,
        normalized_phone,
        phone_key,
        normalized_email,
        booking_code,
        check_in_date,
        check_out_date,
        hotel_code,
        identity_source,
        is_loyalty_eligible
      `)
      .eq("customer_identity", normalizedCustomerId)
      .order("check_in_date", { ascending: false })
      .limit(200);

    if (allowedHotels !== null) {
      staysQuery = staysQuery.in("hotel_code", allowedHotels);
    }

    const { data: stays, error: staysError } =
      await staysQuery.returns<CustomerStay[]>();

    if (staysError) {
      return NextResponse.json(
        { error: "Failed to load customer stays", details: staysError.message },
        { status: 500 }
      );
    }

    if (allowedHotels !== null && (!stays || stays.length === 0)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookingCodes = Array.from(
      new Set(
        (stays ?? [])
          .map((stay) => stay.booking_code?.trim())
          .filter((bookingCode): bookingCode is string => Boolean(bookingCode))
      )
    );

    return NextResponse.json({
      customer: {
        ...customer,
        car: customerNote?.car ?? null,
        customer_profile: customerNote?.customer_profile ?? null,
        source_car: customer.source_car ?? null,
        source_customer_profile: customer.source_customer_profile ?? null,
      },
      bookingCodes,
      stays: stays ?? [],
      user: {
        hotel: user.hotel,
        edit_customer_profile: user.edit_customer_profile,
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