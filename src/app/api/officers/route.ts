import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, reports } from "@/db/schema";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const officersQuery = await db.select({
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            location: user.location,
        }).from(user);

        const officerIds = officersQuery.map(o => o.id);

        let assignmentsQuery: { id: string, status: string, assignedTo: string | null }[] = [];
        if (officerIds.length > 0) {
            assignmentsQuery = await db.select({
                id: reports.id,
                status: reports.status,
                assignedTo: reports.assignedTo
            }).from(reports).where(inArray(reports.assignedTo, officerIds));
        }

        const enrichedOfficers = officersQuery.map(officer => {
            const officerAssignments = assignmentsQuery.filter(r => r.assignedTo === officer.id);
            const active = officerAssignments.filter(r => r.status !== 'ARCHIVED' && r.status !== 'COMPLETED').length;
            const completed = officerAssignments.filter(r => r.status === 'ARCHIVED' || r.status === 'COMPLETED').length;
            const total = officerAssignments.length;
            return {
                ...officer,
                active,
                completed,
                total
            }
        });

        return NextResponse.json(enrichedOfficers);

    } catch (error) {
        console.error("GET /api/officers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
