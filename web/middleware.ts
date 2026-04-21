import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Nothing is gated anymore — auth + billing are modals. Middleware exists
// solely to refresh the Supabase session cookie on each request so server
// components read a fresh user. Webhooks and static assets are bypassed.
const BYPASS_PREFIXES = [
  "/api/webhooks",
  "/auth",
  "/_next",
  "/favicon",
  "/style-examples",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
