import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const { data, error } = await supabase.rpc("search_crm_customers", {
    search_text: search,
    result_limit: 100,
    result_offset: 0,
  });

  if (error) {
    return NextResponse.json(
      { customers: [], message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ customers: data ?? [] });
}
