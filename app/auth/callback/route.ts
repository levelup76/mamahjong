import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** OAuth callback: exchanges the code for a session, then redirects home.
 *
 * The Supabase client is wired directly to request/response cookies here —
 * NOT through getSupabaseServer()/next/headers — because NextResponse.redirect
 * creates a fresh response object that the next/headers cookie store doesn't
 * know about. Without this, exchangeCodeForSession succeeds but the session
 * cookies are never attached to the redirect and the user appears logged out.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const authError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(authError)}`, url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return response;
}
