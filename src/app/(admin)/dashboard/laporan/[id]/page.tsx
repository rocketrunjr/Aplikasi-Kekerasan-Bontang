"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Eye,
    EyeOff,
    UserCheck,
    Phone,
    Archive,
    AlertTriangle,
    FileText,
    CheckCircle2,
    Loader2,
    Trash2,
    FileEdit,
    ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Report, IncidentPhoto, ReportAction, User } from "@/lib/types";
import { mockBontangData } from "@/lib/mock-data";

const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    NEW: { label: "Baru", variant: "destructive" },
    RESPONDING: { label: "Ditanggapi", variant: "default" },
    CONTACTED: { label: "Proses", variant: "secondary" },
    ARCHIVED: { label: "Selesai", variant: "outline" },
};

const actionLabels: Record<string, string> = {
    KIRIM_PETUGAS: "🚨 Kirim Petugas",
    HUBUNGI_KORBAN: "📞 Hubungi Korban",
    ARSIPKAN: "📦 Arsipkan Data",
    HAPUS_LAPORAN: "🗑️ Hapus Laporan Permanen",
};

const photoCategoryLabels: Record<string, string> = {
    LOKASI: "Foto Lokasi",
    KORBAN: "Foto Korban",
    PETUGAS: "Foto Petugas",
    PELAPOR: "Foto Pelapor",
    PELAKU: "Foto Pelaku",
};

export default function ReportDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [showIdentity, setShowIdentity] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<string>("");

    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [editLat, setEditLat] = useState<string>("");
    const [editLng, setEditLng] = useState<string>("");
    const [editKec, setEditKec] = useState<string>("");
    const [editKel, setEditKel] = useState<string>("");

    // Demographic editing state
    const [isEditingDemographic, setIsEditingDemographic] = useState(false);
    const [editJenisKelamin, setEditJenisKelamin] = useState<string>("");
    const [editKategoriKorban, setEditKategoriKorban] = useState<string>("");
    const [editRentangUsia, setEditRentangUsia] = useState<string>("");
    const [editContactPhone, setEditContactPhone] = useState<string>("");

    // Real data state
    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actions, setActions] = useState<ReportAction[]>([]);

    interface IncidentReportDetails {
        officerName: string;
        createdAt: string;
        kronologi: string;
        tindakan: string;
        rekomendasi: string;
        photos: IncidentPhoto[];
    }
    const [incidentReport, setIncidentReport] = useState<IncidentReportDetails | null>(null);

    // Officer Assignment state
    const [officers, setOfficers] = useState<User[]>([]);
    const [selectedOfficer, setSelectedOfficer] = useState<string>("");

    useEffect(() => {
        // Fetch Report
        fetch(`/api/reports/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setReport(data);
                // Fetch Incident Report
                fetch(`/api/reports/${id}/incident`)
                    .then(res => {
                        if (res.ok) return res.json();
                        return null;
                    })
                    .then(incData => {
                        if (incData && incData.officerName) {
                            setIncidentReport(incData);
                        } else {
                            setIncidentReport(null);
                        }
                    })
                    .catch(console.error);

                setActions([]);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });

        // Fetch Officers for assignment Dropdown
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setOfficers(data.filter(u => {
                        const r = u.role?.toLowerCase() || "";
                        return (r === "petugas" || r === "psikolog") && u.isApproved;
                    }));
                }
            })
            .catch(console.error);
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                    Memuat Laporan...
                </h2>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <h2 className="text-xl font-bold text-foreground">
                    Laporan Tidak Ditemukan
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    ID laporan <code className="text-xs">{id}</code> tidak valid.
                </p>
                <Link
                    href="/dashboard/laporan"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>
            </div>
        );
    }

    const status = statusConfig[report.status];

    const enterEditMode = () => {
        if (!report) return;
        setEditLat(report.latitude.toString());
        setEditLng(report.longitude.toString());
        setEditKec(report.kecamatan || "");
        setEditKel(report.kelurahan || "");
        setIsEditingLocation(true);
    };

    const enterDemographicEditMode = () => {
        if (!report) return;
        setEditJenisKelamin(report.jenisKelamin || "");
        setEditKategoriKorban(report.kategoriKorban || "");
        setEditRentangUsia(report.rentangUsia || "");
        setEditContactPhone(report.contactPhone || "");
        setIsEditingDemographic(true);
    };

    const saveDemographic = async () => {
        try {
            const res = await fetch(`/api/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jenisKelamin: editJenisKelamin || null,
                    kategoriKorban: editKategoriKorban || null,
                    rentangUsia: editRentangUsia || null,
                    contactPhone: editContactPhone || null,
                }),
            });
            if (res.ok) {
                setReport(prev => prev ? {
                    ...prev,
                    jenisKelamin: editJenisKelamin || undefined,
                    kategoriKorban: editKategoriKorban || undefined,
                    rentangUsia: editRentangUsia || undefined,
                    contactPhone: editContactPhone || undefined,
                } : prev);
                setIsEditingDemographic(false);
            }
        } catch (err) {
            console.error("Failed to save demographics:", err);
        }
    };

    const saveLocation = async () => {
        if (!report) return;
        try {
            const res = await fetch(`/api/reports/${report.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: parseFloat(editLat),
                    longitude: parseFloat(editLng),
                    kecamatan: editKec,
                    kelurahan: editKel,
                }),
            });
            if (res.ok) {
                setReport((prev) => prev ? {
                    ...prev,
                    latitude: parseFloat(editLat),
                    longitude: parseFloat(editLng),
                    kecamatan: editKec,
                    kelurahan: editKel
                } : null);
                setIsEditingLocation(false);
            }
        } catch (error) {
            console.error("Failed to save location", error);
        }
    };

    const handleAction = (action: string) => {
        setSelectedAction(action);
        setActionDialogOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedAction || !report) return;

        if (selectedAction === "HAPUS_LAPORAN") {
            try {
                const res = await fetch(`/api/reports/${report.id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
                    window.location.href = "/dashboard/laporan";
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
            setActionDialogOpen(false);
            return;
        }

        let newStatus = report.status;
        const payload: Record<string, string> = {};

        if (selectedAction === "KIRIM_PETUGAS") {
            newStatus = "RESPONDING";
            if (!selectedOfficer) return;
            payload.assignedTo = selectedOfficer;
        }
        else if (selectedAction === "HUBUNGI_KORBAN") newStatus = "CONTACTED";
        else if (selectedAction === "ARSIPKAN") newStatus = "ARCHIVED";

        payload.status = newStatus;

        try {
            const res = await fetch(`/api/reports/${report.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                // Ignore typescript generic type issue via type coercion
                setReport((prev) => prev ? { ...prev, status: newStatus as "RESPONDING" | "CONTACTED" | "ARCHIVED" | "NEW", assignedTo: payload.assignedTo } : null);
            }
        } catch (error) {
            console.error("Action error:", error);
        }

        setActionDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link
                        href="/dashboard/laporan"
                        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Daftar
                    </Link>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        Detail Laporan
                    </h1>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">
                        {report.id}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={status.variant} className="rounded-lg text-sm">
                        {status.label}
                    </Badge>
                    {report.assignedTo && report.status !== "NEW" && officers.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                            oleh: {officers.find(o => o.id === report.assignedTo)?.name || report.assignedTo}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Report Info — 2 columns */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Basic Info */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-base font-bold text-card-foreground">
                            Informasi Laporan
                        </h2>
                        <Separator className="my-4" />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Nama Korban
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-sm font-semibold text-card-foreground">
                                        {showIdentity ? report.victimName : report.maskedName}
                                    </p>
                                    <button
                                        onClick={() => setShowIdentity(!showIdentity)}
                                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                        title={
                                            showIdentity
                                                ? "Sembunyikan identitas"
                                                : "Tampilkan identitas (Khusus Psikolog)"
                                        }
                                    >
                                        {showIdentity ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Tipe Laporan
                                </p>
                                <p className="mt-1 text-sm font-semibold text-card-foreground">
                                    {report.reportType === "PANIC_BUTTON"
                                        ? "🚨 Tombol Darurat"
                                        : "📝 Formulir Pengaduan"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Kategori Kekerasan
                                </p>
                                <p className="mt-1 text-sm text-card-foreground">
                                    {report.violenceCategory}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    <Calendar className="mr-1 inline h-3 w-3" />
                                    Tanggal Laporan
                                </p>
                                <p className="mt-1 text-sm text-card-foreground">
                                    {new Date(report.createdAt).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>

                        {report.description && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Kronologi Kejadian
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                                        {report.description}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Demographic & Contact Info */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-card-foreground">
                                👤 Data Pelapor & Demografi Korban
                            </h2>
                            {!isEditingDemographic ? (
                                <Button variant="outline" size="sm" onClick={enterDemographicEditMode}>
                                    <FileEdit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingDemographic(false)}>
                                        Batal
                                    </Button>
                                    <Button size="sm" onClick={saveDemographic}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Simpan
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Separator className="my-4" />

                        {!isEditingDemographic ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Nama Pelapor
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-card-foreground">
                                        {showIdentity ? report.victimName : report.maskedName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        No. Telepon Pelapor
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-card-foreground">
                                        {report.contactPhone || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Jenis Kelamin Korban
                                    </p>
                                    <p className="mt-1 text-sm text-card-foreground">
                                        {report.jenisKelamin || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Kategori Korban
                                    </p>
                                    <p className="mt-1 text-sm text-card-foreground">
                                        {report.kategoriKorban || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Rentang Usia Korban
                                    </p>
                                    <p className="mt-1 text-sm text-card-foreground">
                                        {report.rentangUsia || "-"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">No. Telepon</label>
                                    <Input value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Jenis Kelamin</label>
                                    <Select value={editJenisKelamin} onValueChange={setEditJenisKelamin}>
                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Kategori Korban</label>
                                    <Select value={editKategoriKorban} onValueChange={setEditKategoriKorban}>
                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Anak">Anak</SelectItem>
                                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Rentang Usia</label>
                                    <Select value={editRentangUsia} onValueChange={setEditRentangUsia}>
                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="0-5 Tahun">0-5 Tahun</SelectItem>
                                            <SelectItem value="5-11 Tahun">5-11 Tahun</SelectItem>
                                            <SelectItem value="12-16 Tahun">12-16 Tahun</SelectItem>
                                            <SelectItem value="17-25 Tahun">17-25 Tahun</SelectItem>
                                            <SelectItem value="26-35 Tahun">26-35 Tahun</SelectItem>
                                            <SelectItem value="36-50 Tahun">36-50 Tahun</SelectItem>
                                            <SelectItem value=">50 Tahun">&gt;50 Tahun</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-card-foreground">
                                <MapPin className="mr-1.5 inline h-4 w-4 text-panic" />
                                Lokasi
                            </h2>
                            {!isEditingLocation ? (
                                <Button variant="outline" size="sm" onClick={enterEditMode}>
                                    <FileEdit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingLocation(false)}>
                                        Batal
                                    </Button>
                                    <Button size="sm" onClick={saveLocation}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Simpan
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Separator className="my-4" />

                        {!isEditingLocation ? (
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-8 gap-y-2">
                                    <p>Lat: <span className="font-mono">{report.latitude}</span></p>
                                    <p>Lng: <span className="font-mono">{report.longitude}</span></p>
                                    <p>Kecamatan: <span className="font-mono">{report.kecamatan || "-"}</span></p>
                                    <p>Kelurahan: <span className="font-mono">{report.kelurahan || "-"}</span></p>
                                </div>
                                <a
                                    href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 ml-auto"
                                >
                                    Buka di Google Maps
                                </a>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Latitude</label>
                                    <Input value={editLat} onChange={(e) => setEditLat(e.target.value)} type="number" step="any" className="rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Longitude</label>
                                    <Input value={editLng} onChange={(e) => setEditLng(e.target.value)} type="number" step="any" className="rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Kecamatan</label>
                                    <Select value={editKec} onValueChange={(val) => { setEditKec(val); setEditKel(""); }}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Pilih Kecamatan" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {mockBontangData.map(k => (
                                                <SelectItem key={k.name} value={k.name}>{k.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground">Kelurahan</label>
                                    <Select value={editKel} onValueChange={setEditKel} disabled={!editKec}>
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue placeholder="Pilih Kelurahan" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {editKec && mockBontangData.find(k => k.name === editKec)?.kelurahan.map(kel => (
                                                <SelectItem key={kel.name} value={kel.name}>{kel.name}</SelectItem>
                                            ))}
                                            {(!editKec || mockBontangData.find(k => k.name === editKec)?.kelurahan.length === 0) && (
                                                <SelectItem value="none" disabled>Tidak ada kelurahan</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
                            <MapPin className="mr-2 h-5 w-5" />
                            Peta akan ditampilkan di sini
                        </div>
                    </div>

                    {/* Action History */}
                    {actions.length > 0 && (
                        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                            <h2 className="text-base font-bold text-card-foreground">
                                Riwayat Tindakan
                            </h2>
                            <Separator className="my-4" />
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Tindakan</TableHead>
                                        <TableHead>Petugas</TableHead>
                                        <TableHead>Waktu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actions.map((action) => (
                                        <TableRow key={action.id}>
                                            <TableCell className="font-medium">
                                                {actionLabels[action.actionTaken]}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {action.userName}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(action.timestamp).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Incident Report from Officer */}
                    {incidentReport && (
                        <div className="rounded-2xl border-2 border-teal/30 bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground">
                                    <FileText className="h-5 w-5 text-teal" />
                                    Laporan Insiden Petugas
                                </h2>
                                <span className="flex items-center gap-1 rounded-lg bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Terisi
                                </span>
                            </div>
                            <Separator className="my-4" />

                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Petugas</p>
                                        <p className="font-medium text-card-foreground">
                                            {incidentReport.officerName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tanggal Diisi</p>
                                        <p className="font-medium text-card-foreground">
                                            {new Date(incidentReport.createdAt).toLocaleDateString(
                                                "id-ID",
                                                {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Kronologi Penanganan
                                    </h3>
                                    <p className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-sm text-card-foreground">
                                        {incidentReport.kronologi}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Tindakan yang Diambil
                                    </h3>
                                    <p className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-sm text-card-foreground">
                                        {incidentReport.tindakan}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Rekomendasi
                                    </h3>
                                    <p className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-sm text-card-foreground">
                                        {incidentReport.rekomendasi}
                                    </p>
                                </div>

                                {/* Photo Attachments */}
                                {incidentReport.photos.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Lampiran Foto ({incidentReport.photos.length})
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            {incidentReport.photos.map((photo: IncidentPhoto) => (
                                                <div
                                                    key={photo.id}
                                                    className="rounded-xl border border-border overflow-hidden"
                                                >
                                                    <div className="flex aspect-video items-center justify-center bg-muted/50">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-medium text-card-foreground">
                                                            {photoCategoryLabels[photo.category] ||
                                                                photo.category}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {photo.fileName}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Center — Right column */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-base font-bold text-card-foreground">
                            Pusat Tindakan
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pilih tindakan untuk laporan ini
                        </p>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                            <Button
                                onClick={() => handleAction("KIRIM_PETUGAS")}
                                className="w-full justify-start gap-3 rounded-xl bg-panic py-6 text-left text-panic-foreground shadow-md shadow-panic/15 transition-all hover:bg-panic/90 hover:shadow-lg"
                                disabled={report.status === "ARCHIVED"}
                            >
                                <UserCheck className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Kirim Petugas</p>
                                    <p className="text-xs font-normal opacity-80">
                                        Utus tim ke lokasi korban
                                    </p>
                                </div>
                            </Button>

                            <Button
                                onClick={() => handleAction("HUBUNGI_KORBAN")}
                                className="w-full justify-start gap-3 rounded-xl bg-teal py-6 text-left text-teal-foreground shadow-md shadow-teal/15 transition-all hover:bg-teal/90 hover:shadow-lg"
                                disabled={report.status === "ARCHIVED"}
                            >
                                <Phone className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Beri Proses</p>
                                    <p className="text-xs font-normal opacity-80">
                                        Mulai pendampingan via telepon
                                    </p>
                                </div>
                            </Button>

                            <Button
                                onClick={() => handleAction("ARSIPKAN")}
                                variant="outline"
                                className="w-full justify-start gap-3 rounded-xl py-6 text-left"
                                disabled={report.status === "ARCHIVED"}
                            >
                                <Archive className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">Selesaikan Kasus</p>
                                    <p className="text-xs font-normal text-muted-foreground">
                                        Tutup kasus selesai
                                    </p>
                                </div>
                            </Button>

                            <Button
                                onClick={() => handleAction("HAPUS_LAPORAN")}
                                variant="outline"
                                className="w-full justify-start gap-3 rounded-xl py-6 text-left border-destructive/50 hover:bg-destructive/10"
                            >
                                <Trash2 className="h-5 w-5 shrink-0 text-destructive" />
                                <div>
                                    <p className="font-semibold text-destructive">Hapus Laporan</p>
                                    <p className="text-xs font-normal text-destructive/80">
                                        Hapus data selamanya
                                    </p>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {/* Incident report status indicator */}
                    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-card-foreground">
                            Laporan Insiden
                        </h3>
                        {incidentReport ? (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-teal/10 p-3">
                                <CheckCircle2 className="h-4 w-4 text-teal" />
                                <div>
                                    <p className="text-xs font-semibold text-teal">
                                        Sudah diisi
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        oleh {incidentReport.officerName}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        Belum diisi
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Menunggu petugas
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Tindakan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin melakukan tindakan{" "}
                            <strong>{actionLabels[selectedAction]}</strong> untuk laporan{" "}
                            <code>{report.id}</code>?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAction === "KIRIM_PETUGAS" && (
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block text-foreground">Pilih Petugas Lapangan / Psikolog</label>
                            <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="-- Pilih Petugas / Psikolog --" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {officers.map(off => (
                                        <SelectItem key={off.id} value={off.id}>
                                            {off.name} <span className="text-xs text-muted-foreground ml-1">({off.role})</span>
                                        </SelectItem>
                                    ))}
                                    {officers.length === 0 && (
                                        <SelectItem value="none" disabled>Tidak ada petugas/psikolog aktif</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setActionDialogOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button onClick={confirmAction} className="rounded-xl bg-primary">
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
