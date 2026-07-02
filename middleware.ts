import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;
  const isDashboardHost =
    hostname === 'app.roomy.com.ar' || hostname === 'localhost' || hostname === '127.0.0.1';

  // Skip middleware for static files, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$/.test(pathname)
  ) {
    return supabaseResponse;
  }

  // Dashboard host → rewrite / to /dashboard (the actual PMS page)
  if (isDashboardHost && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.rewrite(url);
  }

  // Landing host → let all through (no auth needed)
  if (!isDashboardHost) {
    return supabaseResponse;
  }

  // ===== Dashboard host auth check =====
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const isPublicApi =
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/api/diagnose-whatsapp') ||
    pathname.startsWith('/api/og') ||
    pathname.startsWith('/api/landing-chat');
  if (isPublicApi) return supabaseResponse;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/auth');
  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/suscripcion');

  // Admin route: redirect unauthenticated users to "/" (not "/auth") to not reveal the route exists
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/* (all auth routes: login, signup, callback, reset password, etc)
     * - api/og, api/webhook, api/diagnose-whatsapp, api/landing-chat (public APIs)
     * - files with extensions (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/og|api/webhook|api/diagnose-whatsapp|api/landing-chat|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
