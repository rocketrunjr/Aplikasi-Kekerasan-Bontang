import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ───── Better Auth tables ─────

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    phone: text("phone"),
    location: text("location"),
    role: text("role", { enum: ["admin", "psikolog", "petugas"] }).notNull().default("petugas"),
    isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(false),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ───── Application tables ─────

export const reports = sqliteTable("reports", {
    id: text("id").primaryKey(),
    victimName: text("victim_name").notNull(),
    maskedName: text("masked_name").notNull(),
    reportType: text("report_type", { enum: ["PANIC_BUTTON", "FORM"] }).notNull(),
    violenceCategory: text("violence_category").notNull(),
    jenisKelamin: text("jenis_kelamin"),
    kategoriKorban: text("kategori_korban"),
    rentangUsia: text("rentang_usia"),
    contactPhone: text("contact_phone"),
    description: text("description").notNull().default(""),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    kecamatan: text("kecamatan"),
    kelurahan: text("kelurahan"),
    status: text("status", { enum: ["NEW", "RESPONDING", "CONTACTED", "ARCHIVED"] }).notNull().default("NEW"),
    assignedTo: text("assigned_to").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const reportActions = sqliteTable("report_actions", {
    id: text("id").primaryKey(),
    reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    actionTaken: text("action_taken", { enum: ["KIRIM_PETUGAS", "HUBUNGI_KORBAN", "ARSIPKAN"] }).notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    userRole: text("user_role", { enum: ["admin", "psikolog", "petugas"] }).notNull(),
    action: text("action", { enum: ["VIEW_DETAIL", "VIEW_IDENTITY", "EDIT_REPORT", "EXPORT_DATA", "UPDATE_STATUS", "ASSIGN_OFFICER"] }).notNull(),
    reportId: text("report_id").notNull(),
    reportMaskedName: text("report_masked_name").notNull(),
    ipAddress: text("ip_address"),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export const accessPermissions = sqliteTable("access_permissions", {
    userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
    userName: text("user_name").notNull(),
    userRole: text("user_role", { enum: ["admin", "psikolog", "petugas"] }).notNull(),
    canViewData: integer("can_view_data", { mode: "boolean" }).notNull().default(false),
    canEditData: integer("can_edit_data", { mode: "boolean" }).notNull().default(false),
    canExportData: integer("can_export_data", { mode: "boolean" }).notNull().default(false),
});

export const incidentReports = sqliteTable("incident_reports", {
    id: text("id").primaryKey(),
    reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
    officerId: text("officer_id").notNull().references(() => user.id),
    officerName: text("officer_name").notNull(),
    kronologi: text("kronologi").notNull(),
    tindakan: text("tindakan").notNull(),
    rekomendasi: text("rekomendasi").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const incidentPhotos = sqliteTable("incident_photos", {
    id: text("id").primaryKey(),
    incidentReportId: text("incident_report_id").notNull().references(() => incidentReports.id, { onDelete: "cascade" }),
    category: text("category", { enum: ["LOKASI", "KORBAN", "PETUGAS", "PELAPOR", "PELAKU"] }).notNull(),
    fileName: text("file_name").notNull(),
    url: text("url").notNull(),
});

export const whatsappNotifications = sqliteTable("whatsapp_notifications", {
    id: text("id").primaryKey(),
    reportId: text("report_id").references(() => reports.id, { onDelete: "cascade" }),
    targetPhone: text("target_phone").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["SENT", "FAILED", "PENDING"] }).notNull().default("PENDING"),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
    id: text("id").primaryKey(),
    appName: text("app_name").notNull().default("Si SAKA"),
    appLogoUrl: text("app_logo_url").notNull().default("/logo.png"),
    heroHeadline: text("hero_headline").notNull().default("Sistem Informasi Stop Kekerasan Anak & Perempuan"),
    heroSubheadline: text("hero_subheadline").notNull().default("Layanan terpadu pelaporan kekerasan di Kota Bontang. Segera laporkan jika Anda atau seseorang yang Anda kenal mengalami tindak kekerasan."),
    contactEmail: text("contact_email").notNull().default("bantuan@sisaka.id"),
    contactPhone: text("contact_phone").notNull().default("081122334455"),
    footerText: text("footer_text").notNull().default("Platform Layanan Perlindungan Masyarakat"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
