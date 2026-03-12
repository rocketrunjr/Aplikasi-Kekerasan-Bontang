export type UserRole = "ADMIN" | "PSIKOLOG" | "PETUGAS";

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
    phone?: string;
    location?: string;
    isApproved?: boolean;
}

export type ReportType = "PANIC_BUTTON" | "FORM";

export type ReportStatus = "NEW" | "RESPONDING" | "CONTACTED" | "ARCHIVED";

export interface Report {
    id: string;
    victimName: string;
    maskedName: string;
    reportType: ReportType;
    violenceCategory: string;
    description: string;
    latitude: number;
    longitude: number;
    kecamatan?: string;
    kelurahan?: string;
    jenisKelamin?: string;
    kategoriKorban?: string;
    rentangUsia?: string;
    contactPhone?: string;
    status: ReportStatus;
    assignedTo?: string;
    createdAt: string;
}

export type ActionType = "KIRIM_PETUGAS" | "HUBUNGI_KORBAN" | "ARSIPKAN";

export interface ReportAction {
    id: string;
    reportId: string;
    userId: string;
    userName: string;
    actionTaken: ActionType;
    timestamp: string;
}

export interface DashboardStats {
    totalReports: number;
    newReports: number;
    respondingReports: number;
    archivedReports: number;
}

// --- Phase 3 Types ---

export type AuditAction =
    | "VIEW_DETAIL"
    | "VIEW_IDENTITY"
    | "EDIT_REPORT"
    | "EXPORT_DATA"
    | "UPDATE_STATUS"
    | "ASSIGN_OFFICER";

export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: AuditAction;
    reportId: string;
    reportMaskedName: string;
    timestamp: string;
    ipAddress: string;
}

export interface AccessPermission {
    userId: string;
    userName: string;
    userRole: UserRole;
    canViewData: boolean;
    canEditData: boolean;
    canExportData: boolean;
}

export interface OfficerAssignment {
    officerId: string;
    reportId: string;
    assignedAt: string;
    status: "ACTIVE" | "COMPLETED";
    completedAt?: string;
}

export interface KecamatanData {
    name: string;
    caseCount: number;
    kelurahan: { name: string; caseCount: number }[];
}

export type PhotoCategory =
    | "LOKASI"
    | "KORBAN"
    | "PETUGAS"
    | "PELAPOR"
    | "PELAKU";

export interface IncidentPhoto {
    id: string;
    category: PhotoCategory;
    fileName: string;
    url: string;
}

export interface IncidentReport {
    id: string;
    reportId: string;
    officerId: string;
    officerName: string;
    kronologi: string;
    tindakan: string;
    rekomendasi: string;
    photos: IncidentPhoto[];
    createdAt: string;
}
