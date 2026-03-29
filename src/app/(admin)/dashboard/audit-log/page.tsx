"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Eye,
    EyeOff,
    FileEdit,
    Download,
    RefreshCw,
    UserPlus,
    ScrollText,
} from "lucide-react";
import { AuditAction, AuditLogEntry } from "@/lib/types";
import { useEffect } from "react";

const actionConfig: Record<
    AuditAction,
    { label: string; icon: React.ElementType; className: string }
> = {
    VIEW_DETAIL: {
        label: "Lihat Detail",
        icon: Eye,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    VIEW_IDENTITY: {
        label: "Lihat Identitas",
        icon: EyeOff,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    EDIT_REPORT: {
        label: "Edit Laporan",
        icon: FileEdit,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    EXPORT_DATA: {
        label: "Ekspor Data",
        icon: Download,
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    UPDATE_STATUS: {
        label: "Update Status",
        icon: RefreshCw,
        className: "bg-teal/10 text-teal border-teal/20",
    },
    ASSIGN_OFFICER: {
        label: "Tugaskan Petugas",
        icon: UserPlus,
        className: "bg-primary/10 text-primary border-primary/20",
    },
};

const ITEMS_PER_PAGE = 10;

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AuditLogPage() {
    const [search, setSearch] = useState("");
    const [filterAction, setFilterAction] = useState<string>("ALL");
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetch("/api/audit-logs")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setLogs(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleFilterAction = (value: string) => {
        setFilterAction(value);
        setCurrentPage(1);
    };

    const filtered = logs.filter((log) => {
        const matchSearch =
            !search ||
            log.userName.toLowerCase().includes(search.toLowerCase()) ||
            log.reportId.toLowerCase().includes(search.toLowerCase());
        const matchAction = filterAction === "ALL" || log.action === filterAction;
        return matchSearch && matchAction;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedLogs = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    <ScrollText className="h-7 w-7 text-primary" />
                    Audit Log
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Riwayat akses dan aktivitas petugas terhadap data korban
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari petugas atau ID laporan..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="rounded-xl pl-9"
                    />
                </div>
                <Select value={filterAction} onValueChange={handleFilterAction}>
                    <SelectTrigger className="w-48 rounded-xl">
                        <SelectValue placeholder="Semua aksi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">Semua Aksi</SelectItem>
                        <SelectItem value="VIEW_DETAIL">Lihat Detail</SelectItem>
                        <SelectItem value="VIEW_IDENTITY">Lihat Identitas</SelectItem>
                        <SelectItem value="EDIT_REPORT">Edit Laporan</SelectItem>
                        <SelectItem value="EXPORT_DATA">Ekspor Data</SelectItem>
                        <SelectItem value="UPDATE_STATUS">Update Status</SelectItem>
                        <SelectItem value="ASSIGN_OFFICER">Tugaskan Petugas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Petugas</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead>Aksi</TableHead>
                            <TableHead>Laporan</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>IP Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    Sedang memuat data...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    Tidak ada log ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((log) => {
                                const ac = actionConfig[log.action];
                                const AcIcon = ac?.icon || ScrollText;
                                return (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.userName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-lg text-xs">
                                                {log.userRole}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${ac.className}`}
                                            >
                                                <AcIcon className="h-3 w-3" />
                                                {ac.label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {log.reportId}
                                            </span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({log.reportMaskedName})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(log.timestamp)}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.ipAddress}
                                        </TableCell>
                                    </TableRow>
                                );
                            }))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} hingga{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} log
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg"
                        >
                            Sebelumnya
                        </Button>
                        <div className="text-sm font-medium">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-lg"
                        >
                            Selanjutnya
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
