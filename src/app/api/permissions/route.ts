import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accessPermissions, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const users = await db.select({
            id: user.id,
            name: user.name,
            role: user.role,
        }).from(user);

        const permissions = await db.select().from(accessPermissions);

        const merged = users.map(u => {
            const perm = permissions.find(p => p.userId === u.id);
            return {
                userId: u.id,
                userName: u.name,
                userRole: u.role,
                canViewData: perm?.canViewData ?? false,
                canEditData: perm?.canEditData ?? false,
                canExportData: perm?.canExportData ?? false,
            };
        });

        return NextResponse.json(merged);
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

        const targetUser = await db.select({ name: user.name, role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
        
        await db.insert(accessPermissions).values({
            userId,
            userName: targetUser[0]?.name || "Unknown",
            userRole: (targetUser[0]?.role as "admin" | "psikolog" | "petugas") || "petugas",
            canViewData: canViewData ?? false,
            canEditData: canEditData ?? false,
            canExportData: canExportData ?? false,
        }).onConflictDoUpdate({
            target: accessPermissions.userId,
            set: {
                canViewData: canViewData ?? false,
                canEditData: canEditData ?? false,
                canExportData: canExportData ?? false,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PATCH /api/permissions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
