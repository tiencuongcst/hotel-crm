"use client";

type Stay = {
  stay_id: string;
  source_customer_id: string | null;
  customer_identity: string;
  customer_name: string | null;
  normalized_phone: string | null;
  phone_key: string | null;
  normalized_email: string | null;
  booking_code: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  hotel_code: string | null;
  identity_source: string | null;
  is_loyalty_eligible: boolean | null;
};

type BookingDetailProps = {
  stay: Stay;
};

export default function BookingDetail({ stay }: BookingDetailProps) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 16, marginTop: 12 }}>
      <h3>Booking detail</h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <Row label="Booking code" value={stay.booking_code} />
          <Row label="Stay ID" value={stay.stay_id} />
          <Row label="Customer ID" value={stay.customer_identity} />
          <Row label="Source customer ID" value={stay.source_customer_id} />
          <Row label="Customer name" value={stay.customer_name} />
          <Row label="Phone" value={stay.normalized_phone} />
          <Row label="Phone key" value={stay.phone_key} />
          <Row label="Email" value={stay.normalized_email} />
          <Row label="Hotel code" value={stay.hotel_code} />
          <Row label="Check-in" value={stay.check_in_date} />
          <Row label="Check-out" value={stay.check_out_date} />
          <Row label="Identity source" value={stay.identity_source} />
          <Row
            label="Loyalty eligible"
            value={stay.is_loyalty_eligible ? "Yes" : "No"}
          />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <tr>
      <td
        style={{
          width: 220,
          fontWeight: 600,
          borderBottom: "1px solid #eee",
          padding: 8,
        }}
      >
        {label}
      </td>
      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
        {value ?? "-"}
      </td>
    </tr>
  );
}