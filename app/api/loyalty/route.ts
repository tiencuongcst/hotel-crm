import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type LoyaltyCustomerRow = {
  id: number;
  customer_identity: string;
  crm_customer_name: string | null;
  crm_phone: string | null;
  crm_email: string | null;
  tier: string | null;
  loyalty_stays: number | null;
  total_stays: number | null;
  sheet_customer_name: string | null;
  sheet_email: string | null;
  sheet_phone_number: string | null;
  discount_type: string | null;
  discount_value: number | null;
  hotel_code: string | null;
  active: boolean | null;
  note: string | null;
  blackout_dates: string | null;
  discount_display: string | null;
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

function escapeSearchValue(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const hotel = sanitizeText(searchParams.get("hotel")).toUpperCase();
    const search = sanitizeText(searchParams.get("search") ?? searchParams.get("q"));
    const active = sanitizeText(searchParams.get("active"));

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("v_customer_loyal_discounts")
      .select(
        `
          id,
          customer_identity,
          crm_customer_name,
          crm_phone,
          crm_email,
          tier,
          loyalty_stays,
          total_stays,
          sheet_customer_name,
          sheet_email,
          sheet_phone_number,
          discount_type,
          discount_value,
          hotel_code,
          active,
          note,
          blackout_dates,
          discount_display
        `,
        { count: "exact" }
      );

    if (hotel && hotel !== "ALL") {
      query = query.eq("hotel_code", hotel);
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
          `customer_identity.ilike.%${safeSearch}%`,
          `crm_customer_name.ilike.%${safeSearch}%`,
          `crm_phone.ilike.%${safeSearch}%`,
          `crm_email.ilike.%${safeSearch}%`,
          `sheet_customer_name.ilike.%${safeSearch}%`,
          `sheet_phone_number.ilike.%${safeSearch}%`,
          `hotel_code.ilike.%${safeSearch}%`,
          `discount_display.ilike.%${safeSearch}%`,
        ].join(",")
      );
    }

    const { data, error, count } = await query
      .order("hotel_code", { ascending: true })
      .order("crm_customer_name", { ascending: true })
      .range(from, to)
      .returns<LoyaltyCustomerRow[]>();

    if (error) {
      return NextResponse.json(
        {
          loyaltyCustomers: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
          message: "Failed to load loyalty customers",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    return NextResponse.json({
      loyaltyCustomers: data ?? [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      message: "success",
    });
  } catch (error) {
    return NextResponse.json(
      {
        loyaltyCustomers: [],
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