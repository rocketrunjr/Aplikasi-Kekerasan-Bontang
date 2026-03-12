import { db, sqlite } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("🌱 Seeding database...");

    // Create tables
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            emailVerified INTEGER NOT NULL DEFAULT 0,
            image TEXT,
            phone TEXT,
            location TEXT,
            role TEXT NOT NULL DEFAULT 'petugas',
            is_approved INTEGER NOT NULL DEFAULT 0,
            failed_login_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS session (
            id TEXT PRIMARY KEY,
            expiresAt INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            ipAddress TEXT,
            userAgent TEXT,
            userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS account (
            id TEXT PRIMARY KEY,
            accountId TEXT NOT NULL,
            providerId TEXT NOT NULL,
            userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            accessToken TEXT,
            refreshToken TEXT,
            idToken TEXT,
            accessTokenExpiresAt INTEGER,
            refreshTokenExpiresAt INTEGER,
            scope TEXT,
            password TEXT,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verification (
            id TEXT PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            expiresAt INTEGER NOT NULL,
            createdAt INTEGER,
            updatedAt INTEGER
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            victim_name TEXT NOT NULL,
            masked_name TEXT NOT NULL,
            report_type TEXT NOT NULL,
            violence_category TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            kecamatan TEXT,
            kelurahan TEXT,
            status TEXT NOT NULL DEFAULT 'NEW',
            assigned_to TEXT REFERENCES user(id),
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS report_actions (
            id TEXT PRIMARY KEY,
            report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES user(id),
            user_name TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES user(id),
            user_name TEXT NOT NULL,
            user_role TEXT NOT NULL,
            action TEXT NOT NULL,
            report_id TEXT NOT NULL,
            report_masked_name TEXT NOT NULL,
            ip_address TEXT,
            timestamp INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS access_permissions (
            user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
            user_name TEXT NOT NULL,
            user_role TEXT NOT NULL,
            can_view_data INTEGER NOT NULL DEFAULT 0,
            can_edit_data INTEGER NOT NULL DEFAULT 0,
            can_export_data INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS incident_reports (
            id TEXT PRIMARY KEY,
            report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            officer_id TEXT NOT NULL REFERENCES user(id),
            officer_name TEXT NOT NULL,
            kronologi TEXT NOT NULL,
            tindakan TEXT NOT NULL,
            rekomendasi TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS incident_photos (
            id TEXT PRIMARY KEY,
            incident_report_id TEXT NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            file_name TEXT NOT NULL,
            url TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS whatsapp_notifications (
            id TEXT PRIMARY KEY,
            report_id TEXT REFERENCES reports(id),
            target_phone TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            sent_at INTEGER,
            created_at INTEGER NOT NULL
        );
    `);

    const now = new Date();

    // Clear existing users to allow Better Auth to recreate them with passwords
    try {
        sqlite.exec('DELETE FROM account; DELETE FROM session; DELETE FROM user;');
    } catch {
        // Ignore if tables don't exist yet
    }

    const targetUsers = [
        { name: "Admin Si SAKA", email: "admin@sisaka.id", role: "admin", phone: "08129876543", location: "Bontang Utara" },
        { name: "Dr. Rina Wahyuni", email: "psikolog@sisaka.id", role: "psikolog", phone: "08123456789", location: "Bontang Selatan" },
        { name: "Budi Prasetyo", email: "budi@sisaka.id", role: "petugas", phone: "08115556667", location: "Bontang Barat" },
        { name: "Siti Nurhaliza", email: "siti@sisaka.id", role: "petugas", phone: "08117778890", location: "Bontang Selatan" }
    ];

    // Import auth to securely register dynamically to avoid top-level issues
    const { auth } = await import("../lib/auth");

    for (const u of targetUsers) {
        // Build the signup payload
        const reqBody = {
            email: u.email,
            password: "Password#123", // Complies with strict password rules
            name: u.name,
            role: u.role,
            phone: u.phone,
            location: u.location
        };

        const req = new Request("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
        });

        const res = await auth.handler(req);
        if (!res.ok) {
            try {
                const err = await res.json();
                console.error(`Failed to seed user ${u.email}:`, err);
            } catch {
                console.error(`Failed to seed user ${u.email}`);
            }
        }

        // Force verify and approve the seeded user (runs even if user already existed)
        await db.update(schema.user)
            .set({ isApproved: true, emailVerified: true })
            .where(eq(schema.user.email, u.email));

        // Seed access permissions for every user
        const userRecord = await db.select().from(schema.user).where(eq(schema.user.email, u.email)).limit(1);
        if (userRecord.length > 0) {
            const userId = userRecord[0].id;
            await db.insert(schema.accessPermissions)
                .values({
                    userId: userId,
                    userName: u.name,
                    userRole: u.role as "admin" | "psikolog" | "petugas",
                    canViewData: u.role === "admin",
                    canEditData: u.role === "admin",
                    canExportData: u.role === "admin",
                })
                .onConflictDoNothing()
                .run();
            console.log(`  ✅ Permissions seeded for ${u.name}`);
        }
    }

    // Seed sample reports
    const reportData = [
        {
            id: "RPT-001",
            victimName: "Sari Amelia",
            maskedName: "S*** A*****",
            reportType: "PANIC_BUTTON" as const,
            violenceCategory: "Fisik",
            description: "Korban melaporkan tindak kekerasan fisik oleh pasangan.",
            latitude: 0.1236,
            longitude: 117.4808,
            kecamatan: "Bontang Selatan",
            kelurahan: "Berbas Pantai",
            status: "NEW" as const,
        },
        {
            id: "RPT-002",
            victimName: "Maya Putri",
            maskedName: "M*** P****",
            reportType: "FORM" as const,
            violenceCategory: "Psikis, Seksual",
            description: "Korban mengalami kekerasan psikis dan seksual di lingkungan kerja.",
            latitude: 0.1408,
            longitude: 117.4898,
            kecamatan: "Bontang Utara",
            kelurahan: "Api-Api",
            status: "RESPONDING" as const,
        },
        {
            id: "RPT-003",
            victimName: "Dian Lestari",
            maskedName: "D*** L******",
            reportType: "FORM" as const,
            violenceCategory: "Fisik, Psikis",
            description: "Korban melaporkan kekerasan fisik dan psikis dalam rumah tangga.",
            latitude: 0.0945,
            longitude: 117.4875,
            kecamatan: "Bontang Selatan",
            kelurahan: "Tanjung Laut",
            status: "CONTACTED" as const,
        },
    ];

    for (const r of reportData) {
        db.insert(schema.reports).values({
            ...r,
            createdAt: now,
            updatedAt: now,
        }).onConflictDoNothing().run();
    }

    console.log("✅ Seed complete!");
    console.log("📋 Users created/updated with password 'Password#123'");
}

seed().catch(console.error);
