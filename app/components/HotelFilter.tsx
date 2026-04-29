"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HOTEL_OPTIONS = ["ALL", "GDB", "TMB", "PVL"];

export default function HotelFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentHotel = searchParams.get("hotel") ?? "ALL";

  function handleChange(hotel: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (hotel === "ALL") {
      params.delete("hotel");
    } else {
      params.set("hotel", hotel);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="font-semibold">Hotel:</label>

      <select
        value={currentHotel}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded border px-3 py-2"
      >
        {HOTEL_OPTIONS.map((hotel) => (
          <option key={hotel} value={hotel}>
            {hotel}
          </option>
        ))}
      </select>
    </div>
  );
}