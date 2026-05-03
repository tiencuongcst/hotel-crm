import { supabase } from "@/lib/supabase";
import PageTitle from "@/app/components/ui/PageTitle"; // ✅ ADD

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
    <main className="min-h-screen bg-slate-50 px-6 pt-5 pb-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* ✅ FIX TITLE */}
        <header className="flex items-center justify-between">
          <PageTitle>Loyalty</PageTitle>
        </header>

        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="text-sm font-semibold text-slate-700">Hotel:</label>

          <select
            name="hotel"
            defaultValue={hotel}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-[260px]"
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
            className="h-11 w-full flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            Apply
          </button>
        </form>

        {error && (
          <div className="rounded-lg border bg-white p-4 text-sm text-red-600">
            Failed to load loyalty: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-white">
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

              {loyalty.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No loyalty customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}