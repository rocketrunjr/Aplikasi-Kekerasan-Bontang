import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear Better Auth session cookies by setting them to expire immediately
    // Use Set-Cookie headers directly for maximum compatibility
    response.headers.append(
        "Set-Cookie",
        "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );
    response.headers.append(
        "Set-Cookie",
        "better-auth.session_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );

    return response;
}

// Also handle GET to allow simple navigation-based logout
export async function GET() {
    const response = NextResponse.redirect(new URL("/", "http://localhost:3000"));

    response.headers.append(
        "Set-Cookie",
        "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );
    response.headers.append(
        "Set-Cookie",
        "better-auth.session_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );

    return response;
}
