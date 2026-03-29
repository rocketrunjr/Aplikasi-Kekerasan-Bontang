import { db } from "@/db";
import { whatsappNotifications, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage` : "";

interface SendMessageOptions {
    chatId: string;
    message: string;
    reportId?: string;
}

async function sendViaTelegram(chatId: string, message: string): Promise<boolean> {
    if (!TELEGRAM_API_URL) {
        console.error("[Telegram] TELEGRAM_BOT_TOKEN is not configured.");
        return false;
    }
    try {
        const response = await fetch(TELEGRAM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });

        const result = await response.json();
        if (!result.ok) {
            console.error("[Telegram] API Error:", result.description);
        }
        return result.ok === true;
    } catch (error) {
        console.error("[Telegram] Failed to send:", error);
        return false;
    }
}

export async function sendTelegramMessage({ chatId, message, reportId }: SendMessageOptions) {
    const now = new Date();
    const id = randomUUID();

    // Log to database (reusing the same whatsappNotifications table to avoid schema migration)
    await db.insert(whatsappNotifications).values({
        id,
        reportId: reportId || null,
        targetPhone: chatId, // Reusing targetPhone for Chat ID
        message,
        status: "PENDING",
        createdAt: now,
    });

    // Send via Telegram
    const success = await sendViaTelegram(chatId, message);

    // Update status
    await db.update(whatsappNotifications)
        .set({
            status: success ? "SENT" : "FAILED",
            sentAt: success ? now : null,
        })
        .where(eq(whatsappNotifications.id, id));

    return { id, success };
}

export async function sendEmergencyAlert(reportId: string, latitude: number, longitude: number, reportType: string = "PANIC_BUTTON") {
    // Dynamically fetch all admins from DB to notify them
    const admins = await db.select({ phone: user.phone })
        .from(user)
        .where(eq(user.role, "admin"));

    const adminChatIds = [...new Set(admins.map(a => a.phone).filter(Boolean) as string[])];

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    let messagePrefix = `🚨 <b>DARURAT - Si SAKA</b>\n\nLaporan darurat baru diterima!\n`;
    if (reportType === "FORM") {
        messagePrefix = `📝 <b>LAPORAN BARU - Si SAKA</b>\n\nLaporan pengaduan baru masuk via formulir!\n`;
    }

    const message =
        `${messagePrefix}` +
        `ID: ${reportId}\n` +
        `📍 Lokasi: <a href="${mapsLink}">Buka Peta</a>\n\n` +
        `Segera periksa dashboard Si SAKA untuk detail lebih lanjut.`;

    const results = [];
    for (const chatId of adminChatIds) {
        const result = await sendTelegramMessage({
            chatId: chatId.trim(),
            message,
            reportId,
        });
        results.push(result);
    }

    return results;
}

export async function sendOfficerNotification(report: { id: string, victimName: string, maskedName: string, reportType: string, violenceCategory: string, createdAt: Date }, officerChatId: string) {
    // Format date properly
    const submitDate = new Date(report.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const message =
        `🚨 <b>Laporan Baru - Si SAKA</b>\n\n` +
        `Anda telah ditugaskan untuk menangani laporan berikut:\n\n` +
        `<b>ID Laporan:</b> ${report.id}\n` +
        `<b>Nama Korban:</b> ${report.victimName}\n` +
        `<b>Tipe Laporan:</b> ${report.reportType}\n` +
        `<b>Kategori:</b> ${report.violenceCategory}\n` +
        `<b>Tanggal:</b> ${submitDate}\n\n` +
        `Data korban sangat di lindungi dan hanya dapat dibuka melalui aplikasi Si SAKA.`;

    return sendTelegramMessage({ chatId: officerChatId, message, reportId: report.id });
}

export async function sendStatusUpdate(chatId: string, reportId: string, newStatus: string) {
    const statusLabels: Record<string, string> = {
        NEW: "Baru",
        RESPONDING: "Ditanggapi",
        CONTACTED: "Proses",
        ARCHIVED: "Selesai",
    };

    const message =
        `📋 <b>Update Status - Si SAKA</b>\n\n` +
        `Laporan ${reportId} telah diperbarui.\n` +
        `Status baru: <b>${statusLabels[newStatus] || newStatus}</b>\n\n` +
        `Terima kasih telah menggunakan Si SAKA.`;

    return sendTelegramMessage({ chatId, message, reportId });
}
