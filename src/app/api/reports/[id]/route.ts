import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { AuditAction } from "@/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        const report = result[0];

        // Audit Logging
        const session = await auth.api.getSession({ headers: request.headers });
        if (session && session.user) {
            const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
            await logAudit({
                userId: session.user.id,
                action: "VIEW_DETAIL",
                reportId: report.id,
                reportMaskedName: report.maskedName,
                ipAddress: ip.split(',')[0],
            });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error("GET /api/reports/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const existing = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
        if (existing.length === 0) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        const reportData = existing[0];

        const updates: Record<string, unknown> = { updatedAt: new Date() };

        let actionLog: AuditAction = "EDIT_REPORT";

        if (body.status) {
            updates.status = body.status;
            actionLog = "UPDATE_STATUS";
        }

        let newlyAssignedTo = null;
        if (body.assignedTo !== undefined) {
            updates.assignedTo = body.assignedTo;
            if (body.assignedTo && body.assignedTo !== reportData.assignedTo) {
                newlyAssignedTo = body.assignedTo;
                actionLog = "ASSIGN_OFFICER";
            }
        }

        if (body.latitude !== undefined) updates.latitude = body.latitude;
        if (body.longitude !== undefined) updates.longitude = body.longitude;
        if (body.kecamatan !== undefined) updates.kecamatan = body.kecamatan;
        if (body.kelurahan !== undefined) updates.kelurahan = body.kelurahan;
        if (body.jenisKelamin !== undefined) updates.jenisKelamin = body.jenisKelamin;
        if (body.kategoriKorban !== undefined) updates.kategoriKorban = body.kategoriKorban;
        if (body.rentangUsia !== undefined) updates.rentangUsia = body.rentangUsia;
        if (body.contactPhone !== undefined) updates.contactPhone = body.contactPhone;

        await db.update(reports).set(updates).where(eq(reports.id, id));

        // Audit Logging
        const session = await auth.api.getSession({ headers: request.headers });
        if (session && session.user) {
            const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
            await logAudit({
                userId: session.user.id,
                action: actionLog,
                reportId: reportData.id,
                reportMaskedName: reportData.maskedName,
                ipAddress: ip.split(',')[0],
            });
        }

        // If newly assigned, notify the appropriate officer/psychologist
        if (newlyAssignedTo) {
            const { user } = await import("@/db/schema");
            const assignee = await db.select({ phone: user.phone }).from(user).where(eq(user.id, newlyAssignedTo)).limit(1);

            if (assignee.length > 0 && assignee[0].phone) {
                const { sendOfficerNotification } = await import("@/lib/telegram");
                try {
                    await sendOfficerNotification({
                        id: reportData.id,
                        victimName: reportData.victimName,
                        maskedName: reportData.maskedName,
                        reportType: reportData.reportType,
                        violenceCategory: reportData.violenceCategory,
                        createdAt: reportData.createdAt
                    }, assignee[0].phone);
                } catch (warn) {
                    console.warn("Could not send officer notification:", warn);
                }
            }
        }

        return NextResponse.json({ id, ...updates });
    } catch (error) {
        console.error("PATCH /api/reports/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const existing = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
        if (existing.length === 0) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        await db.delete(reports).where(eq(reports.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/reports/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
