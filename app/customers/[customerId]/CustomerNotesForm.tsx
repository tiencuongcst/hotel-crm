"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, FileText, Pencil, X } from "lucide-react";

type Props = {
  customerId: string;
  defaultCar?: string | null;
  defaultProfile?: string | null;
  canEdit: boolean;
  compact?: boolean;
};

function EmptyText() {
  return <span className="text-slate-400">Chưa có thông tin</span>;
}

export default function CustomerNotesForm({
  customerId,
  defaultCar,
  defaultProfile,
  canEdit,
  compact = false,
}: Props) {
  const router = useRouter();

  const [car, setCar] = useState(defaultCar ?? "");
  const [profile, setProfile] = useState(defaultProfile ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          car,
          customer_profile: profile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Save failed");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      alert("Error saving customer notes");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setCar(defaultCar ?? "");
    setProfile(defaultProfile ?? "");
    setIsEditing(false);
  }

  return (
    <div className={compact ? "space-y-4" : "rounded-2xl border bg-white p-5 shadow-sm"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Customer Notes</h2>
          <p className="text-sm text-slate-500">
            Car information and customer profile notes
          </p>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={15} />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Car size={16} className="text-slate-400" />
            <span>Car</span>
          </div>

          {isEditing ? (
            <input
              value={car}
              onChange={(event) => setCar(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              placeholder="Ví dụ: Toyota 56N-9999"
            />
          ) : (
            <p className="font-semibold text-slate-950">
              {car ? car : <EmptyText />}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <FileText size={16} className="text-slate-400" />
            <span>Customer Profile</span>
          </div>

          {isEditing ? (
            <textarea
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              placeholder="Ví dụ: VIP, thích phòng yên tĩnh..."
            />
          ) : (
            <p className="whitespace-pre-line font-semibold text-slate-950">
              {profile ? profile : <EmptyText />}
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <X size={15} />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}