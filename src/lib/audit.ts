import { db } from "@/db";
import { auditLogs, user as userSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuditAction } from "./types";

interface AuditLogOptions {
    userId: string;
    action: AuditAction;
    reportId: string;
    reportMaskedName: string;
    ipAddress?: string;
}

export async function logAudit({
    userId,
    action,
    reportId,
    reportMaskedName,
    ipAddress,
}: AuditLogOptions) {
    try {
        const users = await db
            .select({ name: userSchema.name, role: userSchema.role })
            .from(userSchema)
            .where(eq(userSchema.id, userId))
            .limit(1);

        if (users.length === 0) return;

        await db.insert(auditLogs).values({
            id: crypto.randomUUID(),
            userId,
            userName: users[0].name,
            userRole: users[0].role as "admin" | "psikolog" | "petugas",
            action,
            reportId,
            reportMaskedName,
            ipAddress: ipAddress || "127.0.0.1",
            timestamp: new Date(),
        });
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
