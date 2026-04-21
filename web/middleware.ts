import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths that require a logged-in user when auth is enabled.
// Everything else (including `/`) renders for anonymous visitors; unauthed
// users hitting /generate or /edit get a 401 from the API, and ChatView
// shows an inline "Sign in" CTA.
const PROTECTED_PREFIXES = ["/billing"];

// Paths that should never be gated (even when auth is enabled).
const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  "/api/webhooks",
  "/_next",
  "/favicon",
  "/style-examples",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const { response, user, authEnabled } = await updateSession(request);

  if (!authEnabled) return response;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
