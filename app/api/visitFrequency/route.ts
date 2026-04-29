import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("v_crm_customers")
      .select(`
        customer_identity,
        customer_name,
        total_stays,
        loyalty_stays,
        tier
      `)
      .order("total_stays", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json(
      { error: "Failed to load visit frequency" },
      { status: 500 }
    );
  }
}
