"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  canViewCustomerByHotelCodes,
  CurrentUser,
} from "@/lib/currentUser";

export default function CustomerAccessGuard({
  customerHotelCodes,
  children,
}: {
  customerHotelCodes: string[];
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setLoaded(true);
  }, []);

  const canView = useMemo(() => {
    return canViewCustomerByHotelCodes(currentUser, customerHotelCodes);
  }, [currentUser, customerHotelCodes]);

  if (!loaded) {
    return <div style={{ padding: 24 }}>Loading permission...</div>;
  }

  if (!canView) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ color: "red" }}>Access denied</h1>
        <p>Bạn không có quyền xem khách hàng này.</p>
      </div>
    );
  }

  return <>{children}</>;
}