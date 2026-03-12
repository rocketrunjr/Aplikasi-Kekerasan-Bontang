import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/audit-logs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
