import { NextRequest, NextResponse } from "next/server";
import { sendEmergencyAlert, sendStatusUpdate } from "@/lib/telegram";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, reportId, latitude, longitude, phone, newStatus } = body;

        if (type === "emergency") {
            if (!reportId || !latitude || !longitude) {
                return NextResponse.json({ error: "Missing fields for emergency alert" }, { status: 400 });
            }
            const results = await sendEmergencyAlert(reportId, latitude, longitude);
            return NextResponse.json({ success: true, results });
        }

        if (type === "status_update") {
            if (!phone || !reportId || !newStatus) {
                return NextResponse.json({ error: "Missing fields for status update" }, { status: 400 });
            }
            const result = await sendStatusUpdate(phone, reportId, newStatus);
            return NextResponse.json({ success: true, result });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        console.error("POST /api/telegram/send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
