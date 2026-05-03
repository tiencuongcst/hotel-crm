import { NextResponse, type NextRequest } from "next/server";

const COOKIE_KEY = "hotel_crm_current_user_id";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // cho phép login + static
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");

  if (isPublic) {
    return NextResponse.next();
  }

  const userCookie = request.cookies.get(COOKIE_KEY);

  // ❌ chưa login → đá về login
  if (!userCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};