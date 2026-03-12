import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
        }

        const secretKey = process.env.TURNSTILE_SECRET_KEY;
        if (!secretKey) {
            // If not configured, allow through in development
            console.warn("[Turnstile] Secret key not configured. Allowing request.");
            return NextResponse.json({ success: true });
        }

        const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", token);

        const result = await fetch(verifyUrl, {
            method: "POST",
            body: formData,
        });

        const outcome = await result.json();

        if (outcome.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: "Captcha verification failed" },
                { status: 403 }
            );
        }
    } catch (error) {
        console.error("POST /api/captcha/verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
