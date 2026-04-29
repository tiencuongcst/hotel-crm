import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { customerId } = await context.params;

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const normalizedCustomerId = decodeURIComponent(customerId).trim();

    const { data: customer, error: customerError } = await supabase
      .from("v_crm_customers")
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
        ].join(",")
      )
      .eq("customer_identity", normalizedCustomerId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        {
          error: "Failed to load customer",
          details: customerError.message,
        },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found",
          customerId: normalizedCustomerId,
        },
        { status: 404 }
      );
    }

    const { data: stays, error: staysError } = await supabase
      .from("crm_customer_stays_snapshot")
      .select(
        [
          "stay_id",
          "source_customer_id",
          "customer_identity",
          "customer_name",
          "normalized_phone",
          "phone_key",
          "normalized_email",
          "booking_code",
          "check_in_date",
          "check_out_date",
          "hotel_code",
          "identity_source",
          "is_loyalty_eligible",
        ].join(",")
      )
      .eq("customer_identity", normalizedCustomerId)
      .order("check_in_date", { ascending: false })
      .limit(200)
      .returns<CustomerStay[]>();

    if (staysError) {
      return NextResponse.json(
        {
          error: "Failed to load customer stays",
          details: staysError.message,
        },
        { status: 500 }
      );
    }

    const bookingCodes: string[] = [];

    for (const stay of stays ?? []) {
      const bookingCode = stay.booking_code;

      if (
        typeof bookingCode === "string" &&
        bookingCode.trim() !== "" &&
        !bookingCodes.includes(bookingCode)
      ) {
        bookingCodes.push(bookingCode);
      }
    }

    return NextResponse.json({
      customer,
      bookingCodes,
      stays: stays ?? [],
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