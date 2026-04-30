import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type DashboardMetrics = {
  total_customers: number;
  loyalty_customers: number;
  total_stays: number;
  loyalty_stays: number;
  new_customers: number;
  silver_customers: number;
  gold_customers: number;
  platinum_customers: number;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("v_dashboard_overview")
      .select(`
        total_customers,
        loyalty_customers,
        total_stays,
        loyalty_stays,
        new_customers,
        silver_customers,
        gold_customers,
        platinum_customers
      `)
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

    const metrics: DashboardMetrics = data ?? {
      total_customers: 0,
      loyalty_customers: 0,
      total_stays: 0,
      loyalty_stays: 0,
      new_customers: 0,
      silver_customers: 0,
      gold_customers: 0,
      platinum_customers: 0,
    };

    return NextResponse.json({ metrics });
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