"use client";

import Link from "next/link";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight,
    Plus,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Report } from "@/lib/types";

const statusLabel: Record<string, { text: string; className: string }> = {
    NEW: { text: "Baru", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    RESPONDING: { text: "Ditanggapi", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    CONTACTED: { text: "Proses", className: "bg-teal/10 text-teal border-teal/20" },
    ARCHIVED: { text: "Selesai", className: "bg-muted text-muted-foreground border-border" },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function PetugasDashboardPage() {
    const session = authClient.useSession();
    const CURRENT_USER = session.data?.user?.id;
    const [reports, setReports] = useState<Report[]>([]);
    const [canView, setCanView] = useState(false);

    useEffect(() => {
        fetch("/api/reports")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                }
            })
            .catch(err => {
                console.error(err);
            });

        if (CURRENT_USER) {
            fetch("/api/permissions")
                .then(res => res.json())
                .then(data => {
                    const myPerms = data.find((p: { userId: string, canViewData: boolean }) => p.userId === CURRENT_USER);
                    if (myPerms?.canViewData) {
                        setCanView(true);
                    }
                })
                .catch(console.error);
        }
    }, []);

    const myReports = reports.filter((r) => r.assignedTo === CURRENT_USER);

    const activeCount = myReports.filter((r) => r.status === "RESPONDING" || r.status === "CONTACTED").length;
    const completedCount = myReports.filter((r) => r.status === "ARCHIVED").length;
    const pendingCount = myReports.filter((r) => r.status === "NEW").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Dashboard Petugas
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Selamat datang, <strong>{session.data?.user?.name || "Petugas"}</strong> — berikut ringkasan kasus Anda
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-card-foreground">
                                {activeCount}
                            </p>
                            <p className="text-xs text-muted-foreground">Kasus Aktif</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                            <Clock className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-card-foreground">
                                {pendingCount}
                            </p>
                            <p className="text-xs text-muted-foreground">Menunggu</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
                            <CheckCircle2 className="h-5 w-5 text-teal" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-card-foreground">
                                {completedCount}
                            </p>
                            <p className="text-xs text-muted-foreground">Selesai</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Cases */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 px-6 py-4 gap-4">
                    <h2 className="font-bold text-card-foreground">Kasus Saya</h2>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/petugas/laporan/buat"
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
                        >
                            <Plus className="h-3.5 w-3.5" /> Buat Laporan
                        </Link>
                        <Link
                            href="/petugas/status"
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            Lihat Semua <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>ID</TableHead>
                            <TableHead>Korban</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myReports.slice(0, 5).map((report) => {
                            const st = statusLabel[report.status];
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
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${st.className}`}
                                        >
                                            {st.text}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(report.createdAt)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
