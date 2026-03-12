import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const users = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location,
            isApproved: user.isApproved,
            createdAt: user.createdAt,
        }).from(user).orderBy(desc(user.createdAt));

        return NextResponse.json(users);
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, email, role, phone, location, isApproved } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (phone !== undefined) updates.phone = phone;
        if (location !== undefined) updates.location = location;
        if (isApproved !== undefined) updates.isApproved = isApproved;

        await db.update(user).set(updates).where(eq(user.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PATCH /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
