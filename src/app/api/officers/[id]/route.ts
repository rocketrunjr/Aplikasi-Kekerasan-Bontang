import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, reports, reportActions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const officerResult = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            role: user.role,
        }).from(user).where(eq(user.id, id)).limit(1);

        if (officerResult.length === 0) {
            return NextResponse.json({ error: "Officer not found" }, { status: 404 });
        }

        const officer = officerResult[0];

        const assignedReports = await db.select({
            id: reports.id,
            maskedName: reports.maskedName,
            violenceCategory: reports.violenceCategory,
            status: reports.status,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
        }).from(reports).where(eq(reports.assignedTo, id)).orderBy(desc(reports.updatedAt));

        const actions = await db.select({
            id: reportActions.id,
            reportId: reportActions.reportId,
            actionTaken: reportActions.actionTaken,
            timestamp: reportActions.timestamp,
        }).from(reportActions).where(eq(reportActions.userId, id)).orderBy(desc(reportActions.timestamp));

        return NextResponse.json({
            officer,
            assignments: assignedReports,
            actions
        });

    } catch (error) {
        console.error("GET /api/officers/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
