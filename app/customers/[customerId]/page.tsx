import { headers } from "next/headers";
import BookingDetail from "./BookingDetail";

type Customer = {
  customer_identity: string;
  identity_key: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  total_stays: number;
  loyalty_stays: number;
  tier: string | null;
  identity_source: string | null;
  first_stay: string | null;
  last_stay: string | null;
};

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

type CustomerDetailResponse = {
  customer: Customer;
  bookingCodes: string[];
  stays: Stay[];
};

type PageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) {
    throw new Error("Missing request host");
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function getCustomerDetail(
  customerId: string
): Promise<CustomerDetailResponse | null> {
  try {
    const baseUrl = await getBaseUrl();

    const response = await fetch(
      `${baseUrl}/api/customers/${encodeURIComponent(customerId)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Customer detail API error:", response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Fetch customer detail failed:", error);
    return null;
  }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const data = await getCustomerDetail(customerId);

  if (!data) {
    return <div style={{ padding: 24 }}>Customer not found</div>;
  }

  const { customer, stays } = data;

  return (
    <main style={{ padding: 24 }}>
      <h1>{customer.customer_name ?? customer.customer_identity}</h1>

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <p>
          <b>CRM ID:</b> {customer.customer_identity}
        </p>
        <p>
          <b>Phone:</b> {customer.phone ?? "-"}
        </p>
        <p>
          <b>Email:</b> {customer.email ?? "-"}
        </p>
        <p>
          <b>Tier:</b> {customer.tier ?? "-"}
        </p>
        <p>
          <b>Total stays:</b> {customer.total_stays}
        </p>
        <p>
          <b>Loyalty stays:</b> {customer.loyalty_stays}
        </p>
      </section>

      <h2>Booking history</h2>

      {stays.length === 0 ? (
        <p>No booking code found.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 800,
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={thStyle}>Booking Code</th>
                <th style={thStyle}>Check-in Date</th>
                <th style={thStyle}>Hotel</th>
                <th style={thStyle}>Detail</th>
              </tr>
            </thead>

            <tbody>
              {stays.map((stay) => (
                <tr key={stay.stay_id}>
                  <td style={tdStyle}>
                    <b>{stay.booking_code ?? "-"}</b>
                  </td>
                  <td style={tdStyle}>{stay.check_in_date ?? "-"}</td>
                  <td style={tdStyle}>{stay.hotel_code ?? "-"}</td>
                  <td style={tdStyle}>
                    <details>
                      <summary
                        style={{
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        View detail
                      </summary>

                      <BookingDetail stay={stay} />
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #ddd",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};