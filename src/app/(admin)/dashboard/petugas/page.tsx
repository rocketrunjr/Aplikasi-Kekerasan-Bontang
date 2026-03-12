"use client";

import Link from "next/link";
import {
    UserCheck,
    Shield,
    Stethoscope,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { UserRole } from "@/lib/types";

const roleConfig: Record<
    string,
    { label: string; icon: React.ElementType; className: string }
> = {
    admin: {
        label: "Admin",
        icon: Shield,
        className: "bg-primary/10 text-primary border-primary/20",
    },
    psikolog: {
        label: "Psikolog",
        icon: Stethoscope,
        className: "bg-teal/10 text-teal border-teal/20",
    },
    petugas: {
        label: "Petugas Lapangan",
        icon: UserCheck,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
};

type OfficerStat = {
    id: string;
    name: string;
    role: "admin" | "psikolog" | "petugas";
    email: string;
    phone: string | null;
    location: string | null;
    active: number;
    completed: number;
    total: number;
}

export default function PetugasListPage() {
    const [officers, setOfficers] = useState<OfficerStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/officers")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setOfficers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed fetching officers", err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    <UserCheck className="h-7 w-7 text-primary" />
                    Status Petugas
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Lihat detail pekerjaan dan kasus yang ditangani setiap petugas
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12 bg-card rounded-2xl border border-border/50 text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Memuat status petugas...
                </div>
            ) : officers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {officers.map((officer) => {
                        const { active, completed, total } = officer;
                        const completionRate =
                            total > 0 ? Math.round((completed / total) * 100) : 0;
                        const roleKey = officer.role.toLowerCase();
                        const mappedRole = roleConfig[roleKey] || roleConfig.petugas;
                        const RoleIcon = mappedRole.icon;

                        return (
                            <Link
                                key={officer.id}
                                href={`/dashboard/petugas/${officer.id}`}
                                className="group rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-card-foreground">
                                            {officer.name}
                                        </h3>
                                        <span
                                            className={`mt-1 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${mappedRole.className}`}
                                        >
                                            <RoleIcon className="h-3 w-3" />
                                            {mappedRole.label}
                                        </span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                                        <AlertCircle className="mx-auto h-4 w-4 text-amber-500" />
                                        <p className="mt-1 text-lg font-bold text-card-foreground">
                                            {active}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">Aktif</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                                        <CheckCircle2 className="mx-auto h-4 w-4 text-teal" />
                                        <p className="mt-1 text-lg font-bold text-card-foreground">
                                            {completed}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">Selesai</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                                        <Clock className="mx-auto h-4 w-4 text-primary" />
                                        <p className="mt-1 text-lg font-bold text-card-foreground">
                                            {completionRate}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">Rasio</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-teal transition-all"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card p-12 text-center shadow-sm text-muted-foreground">
                    Belum ada petugas atau psikolog yang terdaftar.
                </div>
            )}
        </div>
    );
}
