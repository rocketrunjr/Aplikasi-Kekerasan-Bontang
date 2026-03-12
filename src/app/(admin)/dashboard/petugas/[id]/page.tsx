"use client";

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    Mail,
    Phone,
    MapPin,
    Shield,
    Stethoscope,
    UserCheck,
    CheckCircle2,
    AlertCircle,
    Clock,
    Eye,
} from "lucide-react";
import { ActionType } from "@/lib/types";
import { useState, useEffect } from "react";

const roleConfig: Record<string, { label: string; icon: React.ElementType }> =
{
    admin: { label: "Admin", icon: Shield },
    psikolog: { label: "Psikolog", icon: Stethoscope },
    petugas: { label: "Petugas", icon: UserCheck },
};

const statusBadge: Record<string, string> = {
    ACTIVE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    COMPLETED: "bg-teal/10 text-teal border-teal/20",
};

const actionLabel: Record<ActionType, string> = {
    KIRIM_PETUGAS: "Kirim Petugas",
    HUBUNGI_KORBAN: "Hubungi Korban",
    ARSIPKAN: "Arsipkan",
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

export default function PetugasDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/officers/${id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">Memuat data petugas...</p>
            </div>
        );
    }

    if (!data || !data.officer) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">Petugas tidak ditemukan.</p>
            </div>
        );
    }

    const { officer, assignments = [], actions = [] } = data;

    type Assignment = { id: string; maskedName: string; violenceCategory: string; status: string; updatedAt: string };
    const active = assignments.filter((a: Assignment) => a.status !== "ARCHIVED" && a.status !== "COMPLETED").length;
    const completed = assignments.filter((a: Assignment) => a.status === "ARCHIVED" || a.status === "COMPLETED").length;
    const total = assignments.length;

    // Check both uppercase (from types) and lowercase (from db) to be safe
    const roleKey = officer.role.toLowerCase();
    const role = roleConfig[roleKey] || roleConfig.petugas;
    const RoleIcon = role.icon;

    const officerActions = actions;

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/petugas"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar Petugas
            </Link>

            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                            <RoleIcon className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-card-foreground">
                                {officer.name}
                            </h1>
                            <Badge variant="outline" className="mt-1 rounded-lg">
                                {role.label}
                            </Badge>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            {officer.email}
                        </div>
                        {officer.phone && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0" />
                                {officer.phone}
                            </div>
                        )}
                        {officer.location && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {officer.location}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 lg:w-80">
                    <div className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm">
                        <AlertCircle className="mx-auto h-5 w-5 text-amber-500" />
                        <p className="mt-2 text-2xl font-extrabold text-card-foreground">
                            {active}
                        </p>
                        <p className="text-xs text-muted-foreground">Kasus Aktif</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm">
                        <CheckCircle2 className="mx-auto h-5 w-5 text-teal" />
                        <p className="mt-2 text-2xl font-extrabold text-card-foreground">
                            {completed}
                        </p>
                        <p className="text-xs text-muted-foreground">Selesai</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm">
                        <Clock className="mx-auto h-5 w-5 text-primary" />
                        <p className="mt-2 text-2xl font-extrabold text-card-foreground">
                            {total}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                </div>
            </div>

            {/* Assigned Reports */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="border-b border-border/50 px-6 py-4">
                    <h2 className="font-bold text-card-foreground">Kasus yang Ditangani</h2>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>ID Laporan</TableHead>
                            <TableHead>Korban</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status Tugas</TableHead>
                            <TableHead>Ditugaskan</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignments.map((assign: Assignment) => {
                            const isCompleted = assign.status === "ARCHIVED" || assign.status === "COMPLETED";
                            return (
                                <TableRow key={assign.id}>
                                    <TableCell className="font-mono text-xs font-medium">
                                        {assign.id}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {assign.maskedName}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {assign.violenceCategory}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${isCompleted ? statusBadge.COMPLETED : statusBadge.ACTIVE}`}
                                        >
                                            {!isCompleted ? (
                                                <AlertCircle className="h-3 w-3" />
                                            ) : (
                                                <CheckCircle2 className="h-3 w-3" />
                                            )}
                                            {!isCompleted ? "Aktif" : "Selesai"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(assign.updatedAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/dashboard/laporan/${assign.id}`}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {assignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                    Belum ada kasus yang ditugaskan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Action History */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="border-b border-border/50 px-6 py-4">
                    <h2 className="font-bold text-card-foreground">Riwayat Tindakan</h2>
                </div>
                <div className="p-6">
                    {officerActions.length > 0 ? (
                        <div className="space-y-4">
                            {officerActions.map((action: { id: string, actionTaken: string, reportId: string, timestamp: string }) => (
                                <div key={action.id} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-card-foreground">
                                            {actionLabel[action.actionTaken as ActionType] || action.actionTaken}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Laporan {action.reportId} • {formatDate(action.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Belum ada riwayat tindakan.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
