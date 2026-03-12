import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter for Panic Button
const ipRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const search = searchParams.get("search");

        const query = db.select().from(reports);

        const conditions = [];
        if (status && status !== "ALL") {
            conditions.push(eq(reports.status, status as "NEW" | "RESPONDING" | "CONTACTED" | "ARCHIVED"));
        }
        if (type && type !== "ALL") {
            conditions.push(eq(reports.reportType, type as "PANIC_BUTTON" | "FORM"));
        }
        if (dateFrom) {
            conditions.push(gte(reports.createdAt, new Date(dateFrom)));
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            conditions.push(lte(reports.createdAt, to));
        }

        const results = conditions.length > 0
            ? await query.where(and(...conditions)).orderBy(desc(reports.createdAt))
            : await query.orderBy(desc(reports.createdAt));

        // Filter by search term on JS side for simplicity
        let filtered = results;
        if (search) {
            const s = search.toLowerCase();
            filtered = results.filter(
                (r) =>
                    r.id.toLowerCase().includes(s) ||
                    r.maskedName.toLowerCase().includes(s) ||
                    r.violenceCategory.toLowerCase().includes(s)
            );
        }

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("GET /api/reports error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            victimName,
            reportType,
            violenceCategory,
            description,
            latitude,
            longitude,
            kecamatan,
            kelurahan,
            turnstileToken,
            jenisKelamin,
            kategoriKorban,
            rentangUsia,
            contactPhone,
        } = body;

        // Rate Limiting Logic for Panic Buttons (Forms might have their own flow)
        if (reportType === "PANIC_BUTTON") {
            const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
            const nowMs = Date.now();
            const lastRequestTime = ipRateLimit.get(ip);

            if (lastRequestTime && nowMs - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
                return NextResponse.json(
                    { error: "Too many requests. Please wait 60 seconds before sending another emergency alert." },
                    { status: 429 }
                );
            }
            ipRateLimit.set(ip, nowMs);
        }

        if (!victimName || !reportType || !latitude || !longitude) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify Turnstile Token (unless it's skipped for specific testing flows)
        if (reportType === "PANIC_BUTTON" && !turnstileToken) {
            return NextResponse.json({ error: "Turnstile token required for emergency alerts" }, { status: 403 });
        }

        if (turnstileToken) {
            const secretKey = process.env.TURNSTILE_SECRET_KEY;

            if (secretKey) {
                try {
                    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
                    const formData = new URLSearchParams();
                    formData.append('secret', secretKey);
                    formData.append('response', turnstileToken);

                    const verifyRes = await fetch(verifyUrl, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });

                    const verifyData = await verifyRes.json();

                    if (!verifyData.success) {
                        return NextResponse.json({ error: "Validasi anti-spam gagal" }, { status: 403 });
                    }
                } catch (err) {
                    console.error("Turnstile verification error:", err);
                    return NextResponse.json({ error: "Gagal memvalidasi token keamanan" }, { status: 500 });
                }
            } else {
                console.warn("Turnstile secret key missing, bypassing captcha validation");
            }
        }

        // Generate masked name
        const parts = victimName.split(" ");
        const maskedName = parts
            .map((p: string) => p[0] + "***" + (p.length > 3 ? "*".repeat(p.length - 3) : ""))
            .join(" ");

        const id = `RPT-${String(Date.now()).slice(-6)}`;
        const now = new Date();

        await db.insert(reports).values({
            id,
            victimName,
            maskedName,
            reportType,
            violenceCategory: violenceCategory || "Lainnya",
            description: description || "",
            jenisKelamin: jenisKelamin || null,
            kategoriKorban: kategoriKorban || null,
            rentangUsia: rentangUsia || null,
            contactPhone: contactPhone || null,
            latitude,
            longitude,
            kecamatan: kecamatan || null,
            kelurahan: kelurahan || null,
            status: "NEW",
            createdAt: now,
            updatedAt: now,
        });

        // Trigger notification to Admins
        const { sendEmergencyAlert } = await import("@/lib/telegram");
        try {
            await sendEmergencyAlert(id, latitude, longitude, reportType);
        } catch (warn) {
            console.warn("Could not send emergency alert:", warn);
        }

        return NextResponse.json({ id, maskedName, status: "NEW" }, { status: 201 });
    } catch (error) {
        console.error("POST /api/reports error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
