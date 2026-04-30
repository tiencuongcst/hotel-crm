import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  return hotelCodes.length > 0 ? hotelCodes : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = sanitizeText(
      searchParams.get("search") ?? searchParams.get("q")
    );

    const tier = sanitizeText(searchParams.get("tier"));
    const hotelCodes = parseHotelCodes(
      searchParams.get("hotelCodes") ?? searchParams.get("hotel")
    );

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    const offset = (page - 1) * pageSize;

    const { data, error } = await supabase.rpc("search_customers_enriched", {
      input_search: search,
      input_hotel_codes: hotelCodes,
      input_tier: tier && tier !== "all" ? tier : null,
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

    const total = rows[0]?.total_count ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const customers = rows.map(({ total_count, ...customer }) => customer);

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