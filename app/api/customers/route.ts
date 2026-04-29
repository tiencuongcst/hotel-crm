import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type CustomerRow = {
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
  car: string | null;
  customer_profile: string | null;
  notes_updated_by: string | null;
  notes_updated_at: string | null;
};

function sanitizeSearchParam(value: string | null) {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = sanitizeSearchParam(searchParams.get("search"));
    const tier = sanitizeSearchParam(searchParams.get("tier"));
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("v_crm_customers_enriched")
      .select(
        [
          "customer_identity",
          "identity_key",
          "customer_name",
          "phone",
          "phone_key",
          "email",
          "total_stays",
          "loyalty_stays",
          "tier",
          "tier_priority",
          "identity_source",
          "is_loyalty_eligible",
          "first_stay",
          "last_stay",
          "hotel_codes",
          "source_customer_ids",
          "updated_at",
          "car",
          "customer_profile",
          "notes_updated_by",
          "notes_updated_at",
        ].join(","),
        { count: "exact" }
      )
      .order("tier_priority", { ascending: false })
      .order("total_stays", { ascending: false })
      .order("last_stay", { ascending: false })
      .range(from, to);

    if (tier && tier !== "all") {
      query = query.eq("tier", tier);
    }

    if (search) {
      const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");

      query = query.or(
        [
          `customer_identity.ilike.%${escapedSearch}%`,
          `customer_name.ilike.%${escapedSearch}%`,
          `phone.ilike.%${escapedSearch}%`,
          `email.ilike.%${escapedSearch}%`,
          `car.ilike.%${escapedSearch}%`,
          `customer_profile.ilike.%${escapedSearch}%`,
        ].join(",")
      );
    }

    const { data, error, count } = await query.returns<CustomerRow[]>();

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to load customers",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customers: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
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