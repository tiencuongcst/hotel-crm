"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HOTEL_OPTIONS = ["ALL", "GDB", "TMB", "PVL"];
const STAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10];

export default function VisitFrequencyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentHotel = searchParams.get("hotel") ?? "ALL";
  const currentStays = searchParams.get("stays") ?? "1";

  function updateFilter(key: "hotel" | "stays", value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "hotel" && value === "ALL") {
      params.delete("hotel");
    } else {
      params.set(key, value);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="hotel-filter" className="font-semibold">
          Hotel:
        </label>

        <select
          id="hotel-filter"
          value={currentHotel}
          onChange={(event) => updateFilter("hotel", event.target.value)}
          className="rounded border px-3 py-2"
        >
          {HOTEL_OPTIONS.map((hotel) => (
            <option key={hotel} value={hotel}>
              {hotel}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="stays-filter" className="font-semibold">
          Stays:
        </label>

        <select
          id="stays-filter"
          value={currentStays}
          onChange={(event) => updateFilter("stays", event.target.value)}
          className="rounded border px-3 py-2"
        >
          {STAY_OPTIONS.map((stay) => (
            <option key={stay} value={String(stay)}>
              {stay}+
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}