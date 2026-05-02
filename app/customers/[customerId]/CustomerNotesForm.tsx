"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, FileText, Pencil, X } from "lucide-react";
import { getCurrentUser, CurrentUser } from "@/lib/currentUser";

type Props = {
  customerId: string;
  defaultCar?: string | null;
  defaultProfile?: string | null;
  sourceCar?: string | null;
  sourceProfile?: string | null;
  canEdit: boolean;
  compact?: boolean;
};

function EmptyText() {
  return <span className="text-slate-400">Chưa có thông tin</span>;
}

function SourceBlock({ value }: { value?: string | null }) {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Source Info
      </div>

      <div className="whitespace-pre-line text-sm font-medium text-slate-700">
        {value ? value : <EmptyText />}
      </div>
    </div>
  );
}

export default function CustomerNotesForm({
  customerId,
  defaultCar,
  defaultProfile,
  sourceCar,
  sourceProfile,
  canEdit,
  compact = false,
}: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [car, setCar] = useState(defaultCar ?? "");
  const [profile, setProfile] = useState(defaultProfile ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    setCar(defaultCar ?? "");
    setProfile(defaultProfile ?? "");
  }, [defaultCar, defaultProfile]);

  const canEditCustomerProfile = useMemo(() => {
    return canEdit && currentUser?.can_edit_customer_profile === true;
  }, [canEdit, currentUser]);

  async function handleSave() {
    if (!canEditCustomerProfile || !currentUser?.user_id) {
      alert("Bạn không có quyền chỉnh sửa customer profile");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user-id": currentUser.user_id,
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
    <div
      className={
        compact ? "space-y-4" : "rounded-2xl border bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Customer Notes</h2>
          <p className="text-sm text-slate-500">
            Source info from bookings + manual CRM notes
          </p>
        </div>

        {canEditCustomerProfile && !isEditing && (
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
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Car size={16} className="text-slate-400" />
            <span>Car</span>
          </div>

          <SourceBlock value={sourceCar} />

          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Manual CRM Note
          </div>

          {isEditing ? (
            <input
              value={car}
              onChange={(event) => setCar(event.target.value)}
              disabled={!canEditCustomerProfile || loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900 disabled:bg-slate-100"
              placeholder="Ví dụ: Toyota 56N-9999"
            />
          ) : (
            <p className="font-semibold text-slate-950">
              {car ? car : <EmptyText />}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <FileText size={16} className="text-slate-400" />
            <span>Customer Profile</span>
          </div>

          <SourceBlock value={sourceProfile} />

          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Manual CRM Note
          </div>

          {isEditing ? (
            <textarea
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              disabled={!canEditCustomerProfile || loading}
              className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900 disabled:bg-slate-100"
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
            disabled={!canEditCustomerProfile || loading}
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