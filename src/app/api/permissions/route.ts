import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accessPermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const permissions = await db.select().from(accessPermissions);
        return NextResponse.json(permissions);
    } catch (error) {
        console.error("GET /api/permissions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, canViewData, canEditData, canExportData } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await db.update(accessPermissions).set({
            canViewData: canViewData ?? false,
            canEditData: canEditData ?? false,
            canExportData: canExportData ?? false,
        }).where(eq(accessPermissions.userId, userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PATCH /api/permissions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
