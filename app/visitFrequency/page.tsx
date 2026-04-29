import { supabase } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    stays?: string;
  }>;
};

export default async function VisitFrequencyPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = params?.hotel ?? "ALL";
  const minStays = Number(params?.stays ?? 1);

  // ✅ load hotels (source of truth)
  const { data: hotels } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true });

  let query = supabase
    .from("v_loyal_customers")
    .select(`
      customer_identity,
      customer_name,
      phone,
      loyalty_stays,
      tier,
      first_stay,
      last_stay,
      hotel_codes
    `)
    .gte("loyalty_stays", minStays)
    .order("loyalty_stays", { ascending: true })
    .order("last_stay", { ascending: false })
    .limit(200);

  if (hotel !== "ALL") {
    query = query.contains("hotel_codes", [hotel]);
  }

  const { data } = await query;
  const customers = data ?? [];

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Visit Frequency</h1>

      {/* ✅ FILTER chuẩn */}
      <form className="mb-4 flex items-center gap-2">
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

        <label className="ml-4 font-semibold">Stays:</label>

        <select
          name="stays"
          defaultValue={String(minStays)}
          className="rounded border px-3 py-2"
        >
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="5">5+</option>
          <option value="10">10+</option>
        </select>

        <button type="submit" className="rounded border px-3 py-2">
          Apply
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">CRM ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Loyalty Stays</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">First Stay</th>
              <th className="px-4 py-3 text-left">Last Stay</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer: any) => (
              <tr key={customer.customer_identity} className="border-t">
                <td className="px-4 py-3 font-semibold">
                  {customer.customer_identity}
                </td>
                <td className="px-4 py-3">
                  {customer.customer_name ?? "-"}
                </td>
                <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                <td className="px-4 py-3">
                  {customer.loyalty_stays ?? 0}
                </td>
                <td className="px-4 py-3">{customer.tier ?? "-"}</td>
                <td className="px-4 py-3">
                  {customer.first_stay ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {customer.last_stay ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}