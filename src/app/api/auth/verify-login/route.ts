import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { email, token } = await req.json();

        if (!email || !token) {
            return NextResponse.json(
                { success: false, error: "Email dan token Turnstile wajib diisi" },
                { status: 400 }
            );
        }

        // 1. Verify Turnstile Captcha
        const isDevelopment = process.env.NODE_ENV === "development";
        const secretKey = process.env.TURNSTILE_SECRET_KEY;
        
        if (!secretKey) {
            console.error("[Auth] TURNSTILE_SECRET_KEY is not configured.");
            return NextResponse.json(
                { success: false, error: "Sistem anti-spam belum dikonfigurasi" },
                { status: 500 }
            );
        }

        // Bypass actual API call if it's a known test environment dummy token
        let isTokenValid = false;

        if (isDevelopment && token.length < 50) {
            isTokenValid = true; // Turnstile test tokens are short
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

        // 2. Check Brute Force Protection
        // Normalisasi email agar pencarian case-insensitive
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, normalizedEmail),
        });

        // Jika user tidak ada, sukseskan saja tahap ini agar penyerang 
        // tidak bisa melakukan email enumeration (menebak email terdaftar).
        // Better Auth yang akan menangani "Invalid Email" nantinya.
        if (!existingUser) {
            return NextResponse.json({ success: true });
        }

        if (existingUser.lockedUntil && new Date() < existingUser.lockedUntil) {
            const minutesLeft = Math.ceil(
                (existingUser.lockedUntil.getTime() - new Date().getTime()) / 60000
            );
            return NextResponse.json(
                {
                    success: false,
                    error: `Terlalu banyak percobaan. Akun terkunci, coba lagi dalam ${minutesLeft} menit.`
                },
                { status: 429 }
            );
        }

        // Jika user diblokir permanen karena belum disetujui
        if (!existingUser.isApproved) {
            return NextResponse.json(
                { success: false, error: "Akun Anda belum disetujui oleh Administrator." },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Login Verification Error]:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
