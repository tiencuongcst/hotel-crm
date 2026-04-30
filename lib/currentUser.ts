export type CurrentUser = {
  user_id: string;
  user_name: string;
  hotel: string;
  is_admin: boolean;
  hotel_codes: string[] | null;
  can_edit_customer_profile: boolean;
};

const CURRENT_USER_KEY = "hotel_crm_current_user";

export function saveCurrentUser(user: CurrentUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(CURRENT_USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as CurrentUser;
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function canViewCustomerByHotelCodes(
  user: CurrentUser | null,
  customerHotelCodes: string[] | null | undefined
) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (!user.hotel_codes || user.hotel_codes.length === 0) return false;
  if (!customerHotelCodes || customerHotelCodes.length === 0) return false;

  return customerHotelCodes.some((hotelCode) =>
    user.hotel_codes?.includes(hotelCode)
  );
}