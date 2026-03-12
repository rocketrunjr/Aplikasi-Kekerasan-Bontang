import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";

export async function GET() {
    try {
        const allReports = await db.select().from(reports);

        const stats = {
            totalReports: allReports.length,
            newReports: allReports.filter((r) => r.status === "NEW").length,
            respondingReports: allReports.filter((r) => r.status === "RESPONDING").length,
            contactedReports: allReports.filter((r) => r.status === "CONTACTED").length,
            archivedReports: allReports.filter((r) => r.status === "ARCHIVED").length,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("GET /api/stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
