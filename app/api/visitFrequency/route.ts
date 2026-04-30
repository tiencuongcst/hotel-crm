import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const hotel = sanitizeText(searchParams.get("hotel")) || "ALL";
    const minStays = parsePositiveInteger(searchParams.get("stays"), 1);
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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

    if (hotel !== "ALL") {
      query = query.contains("hotel_codes", [hotel]);
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