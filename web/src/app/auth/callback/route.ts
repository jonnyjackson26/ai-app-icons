import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  console.log("[auth-callback] hit. code?=", !!code, "next=", next);

  if (!code) {
    console.warn("[auth-callback] missing code; redirecting home");
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  let cookieWriteCount = 0;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookieWriteCount += cookiesToSet.length;
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          console.log(
            "[auth-callback] setAll wrote",
            cookiesToSet.length,
            "cookies:",
            cookiesToSet.map((c) => c.name),
          );
        },
      },
    },
  );

  // Log all incoming cookies (names only) so we can see if the PKCE verifier
  // survived Google's round-trip.
  console.log(
    "[auth-callback] incoming cookies:",
    request.cookies.getAll().map((c) => c.name),
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth-callback] exchangeCodeForSession error:", error.message);
    const errUrl = new URL("/", url.origin);
    errUrl.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(errUrl);
  }

  console.log(
    "[auth-callback] exchange OK. user=",
    data?.user?.email,
    "cookies written:",
    cookieWriteCount,
  );

  return response;
}
