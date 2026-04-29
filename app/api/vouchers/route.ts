import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotel = searchParams.get("hotel") || "ALL";

    let query = supabase
      .from("v_vouchers")
      .select(`
        voucher_id,
        voucher_code,
        voucher_name,
        customer_name,
        phone_number,
        hotel_code,
        discount_type,
        discount_value,
        valid_from,
        valid_to,
        status
      `)
      .limit(100);

    if (hotel !== "ALL") {
      query = query.eq("hotel_code", hotel);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { vouchers: [], message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vouchers: data ?? [],
      message: "success",
    });
  } catch (error) {
    return NextResponse.json(
      { vouchers: [], message: "server error" },
      { status: 500 }
    );
  }
}