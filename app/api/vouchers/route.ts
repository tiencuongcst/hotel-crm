import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = sanitizeText(searchParams.get("search"));
    const hotel = sanitizeText(searchParams.get("hotel"));
    const status = sanitizeText(searchParams.get("status"));

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("limit"), 50),
      100
    );

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
        ].join(","),
        { count: "exact" }
      );

    // =========================
    // FILTER HOTEL
    // =========================
    if (hotel && hotel !== "ALL") {
      query = query.eq("hotel_code", hotel);
    }

    // =========================
    // FILTER STATUS
    // =========================
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    // =========================
    // SEARCH
    // =========================
    if (search) {
      const keywords = Array.from(
        new Set(
          [
            search,
            ...search
              .split(/\s+/)
              .map((k) => k.trim())
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
      },
      { status: 500 }
    );
  }
}