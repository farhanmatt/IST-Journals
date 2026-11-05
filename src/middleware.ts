import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "ist-journals-auth-secret-key-production-neon-db-398471923";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the exact /admin route to pass through (it is the Admin login page)
  if (pathname === "/admin") {
    return NextResponse.next();
  }

  // Detect session token supporting both HTTPS (__Secure-) and HTTP standard cookies
  let token = await getToken({ req, secret: authSecret, secureCookie: true });
  if (!token) {
    token = await getToken({ req, secret: authSecret, secureCookie: false });
  }

  // If not authenticated, redirect to appropriate login portal
  if (!token) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const roles = (token.roles as string[]) || [];

  // Check Admin routes (e.g. /admin/dashboard)
  if (pathname.startsWith("/admin/") && !roles.includes("ADMIN")) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  // Check Editor routes
  if (pathname.startsWith("/editor") && !roles.some(r => ["ADMIN", "EDITOR", "SECTION_EDITOR"].includes(r))) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  // Check Author routes
  if (pathname.startsWith("/author") && !roles.includes("AUTHOR")) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  // Check Reviewer routes
  if (pathname.startsWith("/reviewer") && !roles.includes("REVIEWER")) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  // Check Copyeditor routes
  if (pathname.startsWith("/copyeditor") && !roles.some(r => ["ADMIN", "COPYEDITOR"].includes(r))) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  // Check Production Editor routes
  if (pathname.startsWith("/production") && !roles.some(r => ["ADMIN", "PRODUCTION_EDITOR"].includes(r))) {
    return NextResponse.rewrite(new URL("/unauthorized", req.url));
  }

  const isRsc = req.headers.get("rsc") === "1" || req.nextUrl.searchParams.has("_rsc");
  const response = NextResponse.next();

  // Only apply strict no-cache headers to full document navigations (for bfcache back-button security after logout).
  if (!isRsc) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  return response;
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*", 
    "/author/:path*", 
    "/editor/:path*", 
    "/reviewer/:path*", 
    "/copyeditor/:path*", 
    "/production/:path*"
  ],
};
