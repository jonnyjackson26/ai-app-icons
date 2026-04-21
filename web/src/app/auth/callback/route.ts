import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Magic-link + OAuth callback. Exchanges ?code= for a session and redirects
// to ?next. We create the NextResponse up-front and have the Supabase client
// write session cookies directly onto it — in Next.js 15 route handlers,
// cookies mutated via `cookies()` do NOT reliably attach to redirect
// responses, so we must do it this way.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errUrl = new URL("/login", url.origin);
    errUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errUrl);
  }

  return response;
}
