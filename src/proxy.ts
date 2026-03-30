import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const { pathname } = request.nextUrl;

    // Get session token from cookies (checks both local and secure production formats)
    const sessionToken = 
        request.cookies.get("better-auth.session_token")?.value || 
        request.cookies.get("__Secure-better-auth.session_token")?.value;

    // Protected routes that require authentication
    const isDashboard = pathname.startsWith("/dashboard");
    const isPetugas = pathname.startsWith("/petugas");
    const isProtected = isDashboard || isPetugas;

    if (isProtected) {
        if (!sessionToken) {
            url.pathname = "/login";
            url.searchParams.set("redirect", pathname);
            return NextResponse.redirect(url);
        }

        // Validate session and approval status via BetterAuth get-session endpoint
        try {
            const sessionUrl = new URL("/api/auth/get-session", request.url).toString();
            const sessionReq = await fetch(sessionUrl, {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            });

            if (sessionReq.ok) {
                const session = await sessionReq.json();

                if (session && session.user) {
                    if (session.user.isApproved === false) {
                        url.pathname = "/menunggu-persetujuan";
                        return NextResponse.redirect(url);
                    }

                    const userRole = (session.user.role || "").toUpperCase();

                    // Admin panel protection
                    if (isDashboard && userRole !== "ADMIN") {
                        url.pathname = "/petugas";
                        return NextResponse.redirect(url);
                    }

                    // Petugas panel redirect for admins
                    if (isPetugas && userRole === "ADMIN") {
                        url.pathname = "/dashboard";
                        return NextResponse.redirect(url);
                    }
                }
            } else {
                // Invalid session
                url.pathname = "/login";
                return NextResponse.redirect(url);
            }
        } catch (error) {
            console.error("Proxy session fetch error:", error);
            // Allow pass on transient error
        }
    }

    // Redirect logged-in users away from login/register
    if ((pathname === "/login" || pathname === "/register") && sessionToken) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
