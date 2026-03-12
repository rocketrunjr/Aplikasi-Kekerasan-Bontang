import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = "main";

export async function GET() {
    try {
        let settings = await db.query.appSettings.findFirst({
            where: eq(appSettings.id, SETTINGS_ID)
        });

        if (!settings) {
            // Create default settings if they don't exist
            const defaultSettings = {
                id: SETTINGS_ID,
                appName: "Si SAKA",
                appLogoUrl: "/logo.png",
                heroHeadline: "Sistem Informasi Stop Kekerasan Anak & Perempuan",
                heroSubheadline: "Layanan terpadu pelaporan kekerasan di Kota Bontang. Segera laporkan jika Anda atau seseorang yang Anda kenal mengalami tindak kekerasan.",
                contactEmail: "bantuan@sisaka.id",
                contactPhone: "081122334455",
                footerText: "Platform Layanan Perlindungan Masyarakat",
                updatedAt: new Date(),
            };

            await db.insert(appSettings).values(defaultSettings);
            settings = defaultSettings;
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("GET /api/settings error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        // Remove id and updatedAt if present to prevent overriding fixed values
        const updates = { ...body, updatedAt: new Date() };
        delete updates.id;

        await db.update(appSettings)
            .set(updates)
            .where(eq(appSettings.id, SETTINGS_ID));

        const newSettings = await db.query.appSettings.findFirst({
            where: eq(appSettings.id, SETTINGS_ID)
        });

        return NextResponse.json(newSettings);
    } catch (error) {
        console.error("PATCH /api/settings error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
