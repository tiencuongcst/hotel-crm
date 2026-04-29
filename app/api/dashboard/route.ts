import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("v_dashboard_overview")
    .select(`
      total_customers,
      loyalty_customers,
      total_stays,
      loyalty_stays,
      loyalty_points,
      new_customers,
      silver_customers,
      gold_customers,
      platinum_customers
    `)
    .single();

  if (error) {
    return NextResponse.json(
      { metrics: null, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ metrics: data });
}
