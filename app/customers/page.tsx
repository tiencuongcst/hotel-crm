import { supabase } from "@/lib/supabase";
import Link from "next/link";

type PageProps = {
  searchParams?: Promise<{
    hotel?: string;
    search?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const hotel = params?.hotel ?? "ALL";
  const search = params?.search?.trim() ?? "";

  const { data: hotels } = await supabase
    .from("hotels")
    .select("hotel_code, hotel_name")
    .eq("active", true)
    .order("hotel_code", { ascending: true });

  let query = supabase
    .from("v_crm_customers")
    .select(`
      customer_identity,
      customer_name,
      phone,
      email,
      total_stays,
      loyalty_stays,
      tier,
      last_stay,
      hotel_codes
    `)
    .order("loyalty_stays", { ascending: false })
    .order("total_stays", { ascending: false })
    .limit(100);

  if (hotel !== "ALL") {
    query = query.contains("hotel_codes", [hotel]);
  }

  if (search) {
    query = query.or(
      `customer_identity.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  const customers = error ? [] : data ?? [];

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Customers</h1>

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

        <input
          name="search"
          defaultValue={search}
          placeholder="Search customer..."
          className="ml-2 flex-1 rounded border px-4 py-2"
        />

        <button type="submit" className="rounded border px-3 py-2">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">CRM ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Total Stays</th>
              <th className="px-4 py-3 text-left">Loyalty Stays</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">Last Stay</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c: any) => (
              <tr key={c.customer_identity} className="border-t">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/customers/${c.customer_identity}`}>
                    {c.customer_identity}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.customer_name ?? "-"}</td>
                <td className="px-4 py-3">{c.phone ?? "-"}</td>
                <td className="px-4 py-3">{c.email ?? "-"}</td>
                <td className="px-4 py-3">{c.total_stays ?? 0}</td>
                <td className="px-4 py-3">{c.loyalty_stays ?? 0}</td>
                <td className="px-4 py-3">{c.tier ?? "-"}</td>
                <td className="px-4 py-3">{c.last_stay ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}