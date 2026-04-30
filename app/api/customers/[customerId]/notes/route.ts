import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

type CustomerNotesPayload = {
  car?: unknown;
  customer_profile?: unknown;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

async function parseJsonBody(request: Request): Promise<CustomerNotesPayload> {
  try {
    return (await request.json()) as CustomerNotesPayload;
  } catch {
    return {};
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { customerId } = await context.params;
    const normalizedCustomerId = decodeURIComponent(customerId ?? "").trim();

    if (!normalizedCustomerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const body = await parseJsonBody(request);

    const car = normalizeText(body.car);
    const customerProfile = normalizeText(body.customer_profile);

    const updatedBy = "system";

    const { error } = await supabase.from("crm_customer_notes").upsert(
      {
        customer_identity: normalizedCustomerId,
        car,
        customer_profile: customerProfile,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "customer_identity",
      }
    );

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to save customer notes",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer_identity: normalizedCustomerId,
      car,
      customer_profile: customerProfile,
      updated_by: updatedBy,
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