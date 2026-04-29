import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("v_customer_loyal_discounts")
    .select(`
      id,
      customer_identity,
      crm_customer_name,
      crm_phone,
      hotel_code,
      discount_display,
      active,
      note
    `)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ loyalCustomers: data ?? [] });
}