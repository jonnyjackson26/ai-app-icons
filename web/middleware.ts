import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that should never be gated (even when auth is enabled).
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

  // Self-host mode: auth disabled → never gate anything.
  if (!authEnabled) return response;

  // Auth enabled: require login for every app route. This includes `/` so the
  // CLI handoff (`/?cli_callback=...`) naturally redirects to login first and
  // preserves the wizard params via ?next.
  if (!user) {
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
