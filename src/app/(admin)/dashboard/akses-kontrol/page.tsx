"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Lock, Shield, Stethoscope, UserCheck, Eye, FileEdit, Download, Loader2 } from "lucide-react";

const roleIcon: Record<string, React.ElementType> = {
    admin: Shield,
    psikolog: Stethoscope,
    petugas: UserCheck,
};

const roleLabel: Record<string, string> = {
    admin: "Admin",
    psikolog: "Psikolog",
    petugas: "Petugas",
};

export default function AksesKontrolPage() {
    type PermissionState = {
        userId: string;
        userName: string;
        userRole: string;
        canViewData: boolean;
        canEditData: boolean;
        canExportData: boolean;
    };

    const [permissions, setPermissions] = useState<PermissionState[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/permissions")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPermissions(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const togglePermission = async (
        userId: string,
        field: "canViewData" | "canEditData" | "canExportData"
    ) => {
        // Optimistic UI Update
        const oldPerms = [...permissions];
        const newPerms = permissions.map((p) =>
            p.userId === userId ? { ...p, [field]: !p[field] } : p
        );
        setPermissions(newPerms);

        try {
            const targetPerm = newPerms.find(p => p.userId === userId);
            if (!targetPerm) return;

            const res = await fetch("/api/permissions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    canViewData: targetPerm.canViewData,
                    canEditData: targetPerm.canEditData,
                    canExportData: targetPerm.canExportData,
                })
            });

            if (!res.ok) {
                // Revert on failure
                setPermissions(oldPerms);
                console.error("Failed to update permission");
            }
        } catch (error) {
            setPermissions(oldPerms);
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                    Memuat Akses Kontrol...
                </h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    <Lock className="h-7 w-7 text-primary" />
                    Akses Kontrol
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tentukan petugas mana yang dapat mengakses data korban
                </p>
            </div>

            {/* Permission Legend */}
            <div className="flex flex-wrap gap-4 rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Lihat Data — Dapat melihat detail laporan dan identitas korban</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2 text-sm">
                    <FileEdit className="h-4 w-4 text-purple-500" />
                    <span className="text-muted-foreground">Edit — Dapat mengubah data laporan</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2 text-sm">
                    <Download className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Unduh — Dapat mengunduh laporan petugas</span>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Petugas</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead className="text-center">
                                <span className="flex items-center justify-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" />
                                    Lihat Data
                                </span>
                            </TableHead>
                            <TableHead className="text-center">
                                <span className="flex items-center justify-center gap-1.5">
                                    <FileEdit className="h-3.5 w-3.5" />
                                    Edit
                                </span>
                            </TableHead>
                            <TableHead className="text-center">
                                <span className="flex items-center justify-center gap-1.5">
                                    <Download className="h-3.5 w-3.5" />
                                    Unduh
                                </span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {permissions.map((perm) => {
                            const role = perm.userRole.toLowerCase();
                            const RoleIcon = roleIcon[role] || UserCheck;
                            return (
                                <TableRow key={perm.userId}>
                                    <TableCell className="font-medium">{perm.userName}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <RoleIcon className="h-3.5 w-3.5" />
                                            {roleLabel[role] || "Role tidak diketahui"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <ToggleSwitch
                                            enabled={perm.canViewData}
                                            onToggle={() => togglePermission(perm.userId, "canViewData")}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <ToggleSwitch
                                            enabled={perm.canEditData}
                                            onToggle={() => togglePermission(perm.userId, "canEditData")}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <ToggleSwitch
                                            enabled={perm.canExportData}
                                            onToggle={() => togglePermission(perm.userId, "canExportData")}
                                        />
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

function ToggleSwitch({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-teal" : "bg-muted"
                }`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}
