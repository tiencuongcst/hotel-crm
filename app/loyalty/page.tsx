import { supabase } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    search?: string;
  }>;
};

function sanitizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function escapeSearchValue(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export default async function LoyaltyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hotel = params?.hotel ?? "ALL";
  const search = sanitizeText(params?.search);

  const { data: hotels } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true });

  let query = supabase
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
    .order("customer_identity", { ascending: true })
    .limit(100);

  if (hotel !== "ALL") {
    query = query.eq("hotel_code", hotel);
  }

  if (search) {
    const safeSearch = escapeSearchValue(search);

    query = query.or(
      [
        `customer_identity.ilike.%${safeSearch}%`,
        `crm_customer_name.ilike.%${safeSearch}%`,
        `crm_phone.ilike.%${safeSearch}%`,
        `hotel_code.ilike.%${safeSearch}%`,
        `discount_display.ilike.%${safeSearch}%`,
        `note.ilike.%${safeSearch}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  const loyalty = error ? [] : data ?? [];

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Loyalty</h1>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <label className="font-semibold">Hotel:</label>

        <select
          name="hotel"
          defaultValue={hotel}
          className="rounded border px-3 py-2"
        >
          <option value="ALL">ALL</option>

          {(hotels ?? []).map((h) => (
            <option key={h.hotel_code} value={h.hotel_code}>
              {h.hotel_code} - {h.hotel_name}
            </option>
          ))}
        </select>

        <input
          name="search"
          defaultValue={search}
          placeholder="Search CRM ID, customer, phone, hotel, discount, note..."
          className="min-w-[320px] rounded border px-3 py-2"
        />

        <button type="submit" className="rounded border px-3 py-2">
          Apply
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">CRM ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Hotel</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Active</th>
              <th className="px-4 py-3 text-left">Note</th>
            </tr>
          </thead>

          <tbody>
            {loyalty.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-semibold">
                  {c.customer_identity ?? "-"}
                </td>
                <td className="px-4 py-3">{c.crm_customer_name ?? "-"}</td>
                <td className="px-4 py-3">{c.crm_phone ?? "-"}</td>
                <td className="px-4 py-3">{c.hotel_code ?? "-"}</td>
                <td className="px-4 py-3">{c.discount_display ?? "-"}</td>
                <td className="px-4 py-3">{c.active ? "TRUE" : "FALSE"}</td>
                <td className="px-4 py-3">{c.note ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}