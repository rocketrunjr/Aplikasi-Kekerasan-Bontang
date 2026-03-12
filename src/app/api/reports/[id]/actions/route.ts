import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reportActions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const actions = await db.select()
            .from(reportActions)
            .where(eq(reportActions.reportId, id))
            .orderBy(desc(reportActions.timestamp));

        return NextResponse.json(actions);
    } catch (error) {
        console.error("GET /api/reports/[id]/actions error:", error);
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

        const { userId, userName, actionTaken } = body;
        if (!userId || !userName || !actionTaken) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const action = {
            id: randomUUID(),
            reportId: id,
            userId,
            userName,
            actionTaken: actionTaken as "KIRIM_PETUGAS" | "HUBUNGI_KORBAN" | "ARSIPKAN",
            timestamp: new Date(),
        };

        await db.insert(reportActions).values(action);

        return NextResponse.json(action, { status: 201 });
    } catch (error) {
        console.error("POST /api/reports/[id]/actions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
