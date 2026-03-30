"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Phone,
    Send,
    Archive,
    AlertTriangle,
    Loader2,
    Eye,
    FileEdit,
} from "lucide-react";
import { ReportStatus, Report } from "@/lib/types";
import { authClient } from "@/lib/auth-client";

const statusFlow: ReportStatus[] = ["NEW", "RESPONDING", "CONTACTED", "ARCHIVED"];

const statusConfig: Record<
    ReportStatus,
    { label: string; className: string; icon: React.ElementType }
> = {
    NEW: {
        label: "Baru",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: AlertCircle,
    },
    RESPONDING: {
        label: "Ditanggapi",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: Send,
    },
    CONTACTED: {
        label: "Proses",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: Phone,
    },
    ARCHIVED: {
        label: "Selesai",
        className: "bg-teal/10 text-teal border-teal/20",
        icon: Archive,
    },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function StatusPage() {
    const session = authClient.useSession();
    const CURRENT_USER = session.data?.user?.id;
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canView, setCanView] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");

    useEffect(() => {
        if (!CURRENT_USER) return;

        fetch("/api/reports", { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data.filter((r) => r.assignedTo === CURRENT_USER));
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });

        fetch("/api/permissions")
            .then(res => res.json())
            .then(data => {
                const myPerms = data.find((p: { userId: string, canViewData: boolean }) => p.userId === CURRENT_USER);
                setCanView(myPerms?.canViewData === true);
            })
            .catch(console.error);
    }, [CURRENT_USER]);

    // Confirmation dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<{
        reportId: string;
        newStatus: ReportStatus;
        reportLabel: string;
    } | null>(null);

    const requestStatusUpdate = (reportId: string, newStatus: ReportStatus, reportLabel: string) => {
        setPendingUpdate({ reportId, newStatus, reportLabel });
        setConfirmOpen(true);
    };

    const confirmStatusUpdate = async () => {
        if (!pendingUpdate) return;
        try {
            const res = await fetch(`/api/reports/${pendingUpdate.reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: pendingUpdate.newStatus }),
            });
            if (res.ok) {
                setReports((prev) =>
                    prev.map((r) =>
                        r.id === pendingUpdate.reportId
                            ? { ...r, status: pendingUpdate.newStatus }
                            : r
                    )
                );
            } else {
                console.error("Failed to update status");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmOpen(false);
            setPendingUpdate(null);
        }
    };

    // Demographic edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingReportId, setEditingReportId] = useState<string>("");
    const [editJK, setEditJK] = useState("");
    const [editUsia, setEditUsia] = useState("");
    const [editPhone, setEditPhone] = useState("");

    const openEditDialog = (report: Report) => {
        setEditingReportId(report.id);
        setEditJK(report.jenisKelamin || "");
        setEditUsia(report.rentangUsia || "");
        setEditPhone(report.contactPhone || "");
        setEditDialogOpen(true);
    };

    const saveDemographic = async () => {
        if (!editingReportId) return;
        try {
            const res = await fetch(`/api/reports/${editingReportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jenisKelamin: editJK || null,
                    rentangUsia: editUsia || null,
                    contactPhone: editPhone || null,
                }),
            });
            if (res.ok) {
                setReports(prev => prev.map(r => r.id === editingReportId ? {
                    ...r,
                    jenisKelamin: editJK || undefined,
                    rentangUsia: editUsia || undefined,
                    contactPhone: editPhone || undefined,
                } : r));
                setEditDialogOpen(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    <ClipboardList className="h-7 w-7 text-primary" />
                    Status Penanganan
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Lacak dan update status setiap kasus yang Anda tangani
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-3">
                    {statusFlow.map((s) => {
                        const config = statusConfig[s];
                        const count = reports.filter((r) => r.status === s).length;
                        const Icon = config.icon;
                        return (
                            <div
                                key={s}
                                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5 shadow-sm"
                            >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-card-foreground">
                                    {count}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {config.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | "ALL")}>
                    <SelectTrigger className="w-[180px] rounded-xl bg-card">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">Semua Status</SelectItem>
                        <SelectItem value="NEW">Baru</SelectItem>
                        <SelectItem value="RESPONDING">Ditanggapi</SelectItem>
                        <SelectItem value="CONTACTED">Proses</SelectItem>
                        <SelectItem value="ARCHIVED">Selesai</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Case Table */}
            {isLoading ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-border/50 bg-card text-muted-foreground shadow-sm gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memuat status kasus...
                </div>
            ) : reports.length > 0 ? (
                <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>ID</TableHead>
                                <TableHead>Korban</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>JK</TableHead>
                                <TableHead>Usia</TableHead>
                                <TableHead>Telepon</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Update</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead className="w-[140px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports
                                .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
                                .map((report) => {
                                    const st = statusConfig[report.status];
                                    const StIcon = st.icon;

                                    return (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-mono text-xs font-medium">
                                                {report.id}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {canView ? report.victimName : report.maskedName}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {report.violenceCategory}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {report.jenisKelamin || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {report.rentangUsia || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {report.contactPhone || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${st.className}`}
                                                >
                                                    <StIcon className="h-3 w-3" />
                                                    {st.label}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={report.status}
                                                    onValueChange={(val) => requestStatusUpdate(report.id, val as ReportStatus, report.maskedName)}
                                                >
                                                    <SelectTrigger className="h-8 w-[130px] rounded-lg text-xs">
                                                        <SelectValue placeholder="Update Status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="RESPONDING">Ditanggapi</SelectItem>
                                                        <SelectItem value="CONTACTED">Proses</SelectItem>
                                                        <SelectItem value="ARCHIVED">Selesai</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(report.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Link href={`/petugas/laporan-insiden?id=${report.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-lg">
                                                            <Eye className="h-3.5 w-3.5" /> Detail
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg" onClick={() => openEditDialog(report)}>
                                                        <FileEdit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card p-12 text-center shadow-sm">
                    <p className="text-muted-foreground font-medium rounded-lg text-amber-600 bg-amber-500/10 inline-block px-4 py-2">
                        Belum ada laporan yang ditugaskan kepada Anda saat ini. Kosong.
                    </p>
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                        </div>
                        <DialogTitle className="text-center">
                            Konfirmasi Update Status
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Apakah Anda yakin ingin mengubah status laporan{" "}
                            <strong>{pendingUpdate?.reportLabel}</strong> menjadi{" "}
                            <strong>
                                {pendingUpdate
                                    ? statusConfig[pendingUpdate.newStatus].label
                                    : ""}
                            </strong>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmStatusUpdate}
                            className="rounded-xl bg-primary"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Ya, Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Demographic Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Data Demografi</DialogTitle>
                        <DialogDescription>
                            Ubah jenis kelamin, rentang usia, atau telepon pelapor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Jenis Kelamin</label>
                            <Select value={editJK} onValueChange={setEditJK}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Rentang Usia</label>
                            <Select value={editUsia} onValueChange={setEditUsia}>
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
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">No. Telepon</label>
                            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button onClick={saveDemographic} className="rounded-xl bg-primary">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
