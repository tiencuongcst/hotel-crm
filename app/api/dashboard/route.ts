import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("v_dashboard_overview")
    .select(
      [
        "total_customers",
        "loyalty_customers",
        "total_stays",
        "loyalty_stays",
        "new_customers",
        "silver_customers",
        "gold_customers",
        "platinum_customers",
        "loyalty_points",
      ].join(",")
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to load dashboard metrics",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    metrics: data ?? {
      total_customers: 0,
      loyalty_customers: 0,
      total_stays: 0,
      loyalty_stays: 0,
      new_customers: 0,
      silver_customers: 0,
      gold_customers: 0,
      platinum_customers: 0,
      loyalty_points: 0,
    },
  });
}