import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, token, rememberMe } = body;

        if (!email || !password || !token) {
            return NextResponse.json(
                { success: false, error: "Email, password, dan token Turnstile wajib diisi" },
                { status: 400 }
            );
        }

        // 1. Verify Turnstile Captcha
        const isDevelopment = process.env.NODE_ENV === "development";
        const secretKey =
            process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

        let isTokenValid = false;
        if (isDevelopment && secretKey === "1x0000000000000000000000000000000AA") {
            isTokenValid = true;
        } else {
            const verifyRes = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(
                        token
                    )}`,
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const verifyData = await verifyRes.json();
            isTokenValid = verifyData.success;
        }

        if (!isTokenValid) {
            return NextResponse.json(
                { success: false, error: "Verifikasi captcha gagal" },
                { status: 400 }
            );
        }

        // 2. Check user exists and approval
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, normalizedEmail),
        });

        if (existingUser && !existingUser.isApproved) {
            return NextResponse.json(
                { success: false, error: "Akun Anda belum disetujui oleh Administrator." },
                { status: 403 }
            );
        }

        // 3. Authenticate with Better Auth
        // Create an internal request mimicking the original to trigger Auth properly
        const authReqContext = new Request(`${req.nextUrl.origin}/api/auth/sign-in/email`, {
            method: "POST",
            headers: req.headers,
            body: JSON.stringify({ email, password, rememberMe }),
        });

        const authResponse = await auth.handler(authReqContext);

        if (!authResponse.ok) {
            // Read the auth error if possible
            let authError = "Email atau password salah";
            try {
                const errData = await authResponse.clone().json();
                if (errData.message) authError = errData.message;
            } catch { }

            return NextResponse.json(
                { success: false, error: authError },
                { status: 401 }
            );
        }

        // Success

        // Return the Better Auth response to preserve session cookies
        const responseData = await authResponse.json();
        const response = NextResponse.json({ success: true, data: responseData });

        // Copy cookies from Better Auth response
        authResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
                response.headers.append("Set-Cookie", value);
            }
        });

        return response;

    } catch (error) {
        console.error("[Login Security API Error]:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
