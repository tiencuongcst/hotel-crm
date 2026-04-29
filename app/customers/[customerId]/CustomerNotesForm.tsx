"use client";

import { useState } from "react";

type Props = {
  customerId: string;
  initialCar: string | null;
  initialCustomerProfile: string | null;
};

export default function CustomerNotesForm({
  customerId,
  initialCar,
  initialCustomerProfile,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [car, setCar] = useState(initialCar ?? "");
  const [customerProfile, setCustomerProfile] = useState(
    initialCustomerProfile ?? ""
  );
  const [savedCar, setSavedCar] = useState(initialCar ?? "");
  const [savedCustomerProfile, setSavedCustomerProfile] = useState(
    initialCustomerProfile ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/customers/${encodeURIComponent(customerId)}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            car,
            customer_profile: customerProfile,
          }),
        }
      );

      if (!response.ok) {
        setMessage("Save failed");
        return;
      }

      setSavedCar(car);
      setSavedCustomerProfile(customerProfile);
      setIsEditing(false);
      setMessage("Saved successfully");
    } catch {
      setMessage("Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setCar(savedCar);
    setCustomerProfile(savedCustomerProfile);
    setIsEditing(false);
    setMessage("");
  }

  return (
    <section style={{ marginTop: 16, marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Customer Notes</h2>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setMessage("");
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #111",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        ) : null}
      </div>

      {!isEditing ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p>
            <b>Car:</b> {savedCar.trim() ? savedCar : "-"}
          </p>
          <p>
            <b>Customer Profile:</b>{" "}
            {savedCustomerProfile.trim() ? savedCustomerProfile : "-"}
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontWeight: 700 }}>Car</label>
            <input
              value={car}
              onChange={(event) => setCar(event.target.value)}
              placeholder="Example: Toyota, Mercedes..."
              style={{
                width: "100%",
                maxWidth: 500,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontWeight: 700 }}>
              Customer Profile
            </label>
            <textarea
              value={customerProfile}
              onChange={(event) => setCustomerProfile(event.target.value)}
              placeholder="VIP note, preference, family, blacklist note..."
              rows={4}
              style={{
                width: "100%",
                maxWidth: 800,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #111",
                background: isSaving ? "#ddd" : "#111",
                color: isSaving ? "#111" : "#fff",
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? "Saving..." : "Save Notes"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {message ? <p style={{ marginTop: 8 }}>{message}</p> : null}
    </section>
  );
}