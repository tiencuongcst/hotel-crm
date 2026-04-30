"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, CurrentUser } from "@/lib/currentUser";

type Hotel = {
  hotel_code: string;
  hotel_name: string | null;
};

type Customer = {
  customer_identity: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  total_stays: number | null;
  loyalty_stays: number | null;
  tier: string | null;
  last_stay: string | null;
  hotel_codes: string[] | null;
};

export default function CustomersPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedHotel, setSelectedHotel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const visibleHotels = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.is_admin) return hotels;

    return hotels.filter((hotel) =>
      currentUser.hotel_codes?.includes(hotel.hotel_code)
    );
  }, [currentUser, hotels]);

  async function loadHotels() {
    const { data, error } = await supabase
      .from("hotels")
      .select("hotel_code, hotel_name")
      .eq("active", true)
      .order("hotel_code", { ascending: true });

    if (error) {
      setErrorMessage("Cannot load hotels");
      return;
    }

    setHotels(data ?? []);
  }

  async function loadCustomers(
  user: CurrentUser,
  hotel: string,
  keyword: string
) {
  setLoading(true);
  setErrorMessage("");

  const hotelCodesForSearch =
    user.is_admin
      ? hotel === "ALL"
        ? null
        : [hotel]
      : hotel === "ALL"
        ? user.hotel_codes
        : [hotel];

  if (!user.is_admin && (!hotelCodesForSearch || hotelCodesForSearch.length === 0)) {
    setCustomers([]);
    setLoading(false);
    return;
  }

  const { data, error } = await supabase.rpc("search_customers_enriched", {
    input_search: keyword.trim(),
    input_hotel_codes: hotelCodesForSearch,
    input_limit: 100,
  });

  if (error) {
    console.error("Search customers failed:", error);
    setErrorMessage("Cannot load customers");
    setCustomers([]);
  } else {
    setCustomers(data ?? []);
  }

  setLoading(false);
}

  useEffect(() => {
    if (!currentUser) return;

    loadHotels();
    loadCustomers(currentUser, selectedHotel, search);
  }, [currentUser]);

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) return;

    loadCustomers(currentUser, selectedHotel, search);
  }

  if (!currentUser) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Not logged in</h1>
        <p>Please login to view customers.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Customers</h1>

      <form className="mb-4 flex items-center gap-2" onSubmit={handleApply}>
        <label className="font-semibold">Hotel:</label>

        <select
          value={selectedHotel}
          onChange={(event) => setSelectedHotel(event.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="ALL">ALL</option>

          {visibleHotels.map((hotel) => (
            <option key={hotel.hotel_code} value={hotel.hotel_code}>
              {hotel.hotel_code} - {hotel.hotel_name}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer..."
          className="ml-2 flex-1 rounded border px-4 py-2"
        />

        <button type="submit" className="rounded border px-3 py-2">
          Apply
        </button>
      </form>

      {errorMessage ? (
        <p className="mb-3 text-red-600">{errorMessage}</p>
      ) : null}

      {loading ? (
        <p>Loading customers...</p>
      ) : (
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
              {customers.map((customer) => (
                <tr key={customer.customer_identity} className="border-t">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/customers/${customer.customer_identity}`}>
                      {customer.customer_identity}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.customer_name ?? "-"}</td>
                  <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                  <td className="px-4 py-3">{customer.email ?? "-"}</td>
                  <td className="px-4 py-3">{customer.total_stays ?? 0}</td>
                  <td className="px-4 py-3">{customer.loyalty_stays ?? 0}</td>
                  <td className="px-4 py-3">{customer.tier ?? "-"}</td>
                  <td className="px-4 py-3">{customer.last_stay ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}