import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get session token from cookies
    const sessionToken = request.cookies.get("better-auth.session_token")?.value;

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/petugas"];
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtected) {
        if (!sessionToken) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Validate session and approval status via BetterAuth get-session endpoint
        try {
            const sessionReq = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            });

            if (sessionReq.ok) {
                const session = await sessionReq.json();

                // If user is not approved, redirect to holding page
                if (session && session.user) {
                    if (session.user.isApproved === false) {
                        return NextResponse.redirect(new URL("/menunggu-persetujuan", request.url));
                    }

                    const userRole = (session.user.role || "").toUpperCase();

                    // Admin panel protection
                    if (pathname.startsWith("/dashboard") && userRole !== "ADMIN") {
                        return NextResponse.redirect(new URL("/petugas", request.url));
                    }

                    // Petugas panel redirect for admins (optional, but good for separation)
                    if (pathname.startsWith("/petugas") && userRole === "ADMIN") {
                        return NextResponse.redirect(new URL("/dashboard", request.url));
                    }
                }
            } else {
                // Invalid session
                return NextResponse.redirect(new URL("/login", request.url));
            }
        } catch (error) {
            console.error("Middleware session fetch error:", error);
            // On fetch error, allow it to pass or redirect to login. We'll allow and let page handles it.
        }
    }

    // If user is logged in (has cookie) and trying to access login or register, redirect to dashboard
    if ((pathname === "/login" || pathname === "/register") && sessionToken) {
        // Technically we should check if they are approved to redirect to /dashboard or /menunggu-persetujuan
        // But the middleware fetch might be slow for every public page, so we just redirect to dashboard
        // and let the dashboard middleware check bounce them if needed.
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/petugas/:path*",
        "/login",
    ],
};
