import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");

        const logs = await db.select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.timestamp))
            .limit(limit);

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/audit-log error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
