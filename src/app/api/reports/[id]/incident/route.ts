import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidentReports, incidentPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const report = await db.select()
            .from(incidentReports)
            .where(eq(incidentReports.reportId, id))
            .limit(1);

        if (report.length === 0) {
            return NextResponse.json(null);
        }

        const photos = await db.select()
            .from(incidentPhotos)
            .where(eq(incidentPhotos.incidentReportId, report[0].id));

        return NextResponse.json({ ...report[0], photos });
    } catch (error) {
        console.error("GET /api/reports/[id]/incident error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { officerId, officerName, kronologi, tindakan, rekomendasi, photos } = body;

        if (!officerId || !officerName || !kronologi || !tindakan || !rekomendasi) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existing = await db.select().from(incidentReports).where(eq(incidentReports.reportId, id)).limit(1);

        let incidentId;
        const now = new Date();

        if (existing.length > 0) {
            incidentId = existing[0].id;
            await db.update(incidentReports).set({
                officerId,
                officerName,
                kronologi,
                tindakan,
                rekomendasi,
            }).where(eq(incidentReports.id, incidentId));

            // Delete old photos before re-inserting
            if (photos && Array.isArray(photos)) {
                await db.delete(incidentPhotos).where(eq(incidentPhotos.incidentReportId, incidentId));
            }
        } else {
            incidentId = randomUUID();
            await db.insert(incidentReports).values({
                id: incidentId,
                reportId: id,
                officerId,
                officerName,
                kronologi,
                tindakan,
                rekomendasi,
                createdAt: now,
            });
        }

        // Insert photos if any
        if (photos && Array.isArray(photos)) {
            for (const photo of photos) {
                await db.insert(incidentPhotos).values({
                    id: randomUUID(),
                    incidentReportId: incidentId,
                    category: photo.category,
                    fileName: photo.fileName,
                    url: photo.url,
                });
            }
        }

        return NextResponse.json({ id: incidentId }, { status: 201 });
    } catch (error) {
        console.error("POST /api/reports/[id]/incident error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
