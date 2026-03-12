import Link from "next/link";
import { FileText, AlertTriangle, Users, Archive, ArrowRight, BarChart3 } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { ReportTable } from "@/components/admin/report-table";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { count, desc, inArray, eq } from "drizzle-orm";
import { Report, KecamatanData } from "@/lib/types";

// Static BONTANG coords
const kelurahanCoords: Record<string, [number, number]> = {
    "Berbas Pantai": [0.0852, 117.4665],
    "Berbas Tengah": [0.0941, 117.4736],
    "Tanjung Laut": [0.0945, 117.4875],
    "Tanjung Laut Indah": [0.1012, 117.4956],
    "Satimpo": [0.0798, 117.4801],
    "Api-Api": [0.1408, 117.4898],
    "Lok Tuan": [0.1572, 117.4816],
    "Bontang Baru": [0.1316, 117.4723],
    "Gunung Elai": [0.1489, 117.4647],
    "Kanaan": [0.1217, 117.4538],
    "Belimbing": [0.1097, 117.4512],
    "Gunung Telihan": [0.1356, 117.4425],
    "Bontang Lestari": [0.0543, 117.4267],
    "Bontang Kuala": [0.1517, 117.5029],
    "Guntung": [0.1685, 117.4827],
};

function getClosestKelurahan(lat: number, lng: number): string {
    let closest = "";
    let minD = Infinity;
    Object.entries(kelurahanCoords).forEach(([name, [klat, klng]]) => {
        const d = Math.pow(lat - klat, 2) + Math.pow(lng - klng, 2);
        if (d < minD) {
            minD = d;
            closest = name;
        }
    });
    return closest || "Api-Api";
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(5);

    // Calculate stats
    const totalCount = await db.select({ value: count() }).from(reports);
    const newCount = await db.select({ value: count() }).from(reports).where(eq(reports.status, "NEW"));
    const respondingCount = await db.select({ value: count() }).from(reports).where(inArray(reports.status, ["RESPONDING", "CONTACTED"]));
    const archivedCount = await db.select({ value: count() }).from(reports).where(eq(reports.status, "ARCHIVED"));

    // Calculate Demographic Map logic dynamically across ALL reports
    const __all = await db.select().from(reports);
    const kecamatanData: KecamatanData[] = [
        {
            name: "Bontang Selatan", caseCount: 0,
            kelurahan: [
                { name: "Berbas Pantai", caseCount: 0 }, { name: "Berbas Tengah", caseCount: 0 },
                { name: "Tanjung Laut", caseCount: 0 }, { name: "Tanjung Laut Indah", caseCount: 0 },
                { name: "Satimpo", caseCount: 0 }, { name: "Bontang Lestari", caseCount: 0 }
            ]
        },
        {
            name: "Bontang Utara", caseCount: 0,
            kelurahan: [
                { name: "Bontang Kuala", caseCount: 0 }, { name: "Guntung", caseCount: 0 },
                { name: "Api-Api", caseCount: 0 }, { name: "Lok Tuan", caseCount: 0 },
                { name: "Bontang Baru", caseCount: 0 }, { name: "Gunung Elai", caseCount: 0 }
            ]
        },
        {
            name: "Bontang Barat", caseCount: 0,
            kelurahan: [
                { name: "Kanaan", caseCount: 0 }, { name: "Belimbing", caseCount: 0 },
                { name: "Gunung Telihan", caseCount: 0 }
            ]
        }
    ];

    __all.forEach(r => {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        if (!lat || !lng) return;

        let closestKel = r.kelurahan || "";
        if (!closestKel || !kelurahanCoords[closestKel]) {
            closestKel = getClosestKelurahan(lat, lng);
        }

        for (const kec of kecamatanData) {
            const kel = kec.kelurahan.find(k => k.name === closestKel);
            if (kel) {
                kel.caseCount++;
                kec.caseCount++;
                break;
            }
        }
    });

    // Calculate generic demographic groupings
    const genderStats: Record<string, number> = { "Laki-laki": 0, "Perempuan": 0 };
    const ageStats: Record<string, number> = { "0-5 Tahun": 0, "5-11 Tahun": 0, "12-16 Tahun": 0, "17-25 Tahun": 0, "26-35 Tahun": 0, "36-50 Tahun": 0, ">50 Tahun": 0 };
    const categoryStats: Record<string, number> = {};

    __all.forEach(r => {
        if (r.jenisKelamin && genderStats[r.jenisKelamin] !== undefined) genderStats[r.jenisKelamin]++;
        if (r.rentangUsia && ageStats[r.rentangUsia] !== undefined) ageStats[r.rentangUsia]++;

        // Count category
        const cats = r.violenceCategory.split(", ");
        for (const cat of cats) {
            const cleaned = cat.trim();
            if (!cleaned) continue;
            categoryStats[cleaned] = (categoryStats[cleaned] || 0) + 1;
        }
    });

    const categoryStatsArr = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ringkasan laporan dan aktivitas terkini
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Laporan"
                    value={totalCount[0].value}
                    icon={FileText}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <StatsCard
                    title="Laporan Baru"
                    value={newCount[0].value}
                    icon={AlertTriangle}
                    color="text-panic"
                    bgColor="bg-panic/10"
                />
                <StatsCard
                    title="Sedang Ditangani"
                    value={respondingCount[0].value}
                    icon={Users}
                    color="text-teal"
                    bgColor="bg-teal/10"
                />
                <StatsCard
                    title="Diarsipkan"
                    value={archivedCount[0].value}
                    icon={Archive}
                    color="text-muted-foreground"
                    bgColor="bg-muted"
                />
            </div>

            {/* Recent Reports */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Laporan Terbaru</h2>
                    <Link
                        href="/dashboard/laporan"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        Lihat Semua
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <ReportTable reports={allReports as unknown as Report[]} />
            </div>

            {/* Demographic Stats Grid */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Demografi Area Kasus</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {kecamatanData.map((kec) => (
                        <div key={kec.name} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-card-foreground text-sm flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    {kec.name}
                                </h3>
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {kec.caseCount} kasus
                                </span>
                            </div>
                            <div className="space-y-2.5">
                                {kec.kelurahan.map(kel => (
                                    <div key={kel.name} className="flex flex-col gap-1 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">{kel.name}</span>
                                            <span className="text-xs font-medium">{kel.caseCount}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full bg-red-500/80 transition-all ${kel.caseCount === 0 ? 'hidden' : ''}`}
                                                style={{ width: `${Math.max(5, (kel.caseCount / Math.max(1, kec.caseCount)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Demographics Overview (Gender, Age, Category) */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Statistik Laporan Lanjutan
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Gender */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-card-foreground text-sm flex items-center justify-between">
                            Jenis Kelamin
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Total Terdata</span>
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(genderStats).map(([key, count]) => (
                                <div key={key} className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">{key}</span>
                                        <span className="text-xs font-semibold">{count}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full ${key === "Perempuan" ? "bg-pink-500/80" : "bg-blue-500/80"} transition-all ${count === 0 ? 'hidden' : ''}`}
                                            style={{ width: `${Math.max(5, (count / Math.max(1, __all.length)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Age Range */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-card-foreground text-sm flex items-center justify-between">
                            Rentang Usia (Korban)
                        </h3>
                        <div className="space-y-2.5">
                            {Object.entries(ageStats).map(([key, count]) => (
                                <div key={key} className="flex flex-col gap-0.5 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-[11px]">{key}</span>
                                        <span className="text-[11px] font-medium">{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full bg-teal/80 transition-all ${count === 0 ? 'hidden' : ''}`}
                                            style={{ width: `${Math.max(3, (count / Math.max(1, __all.length)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Report Category Breakdown */}
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-card-foreground text-sm flex items-center justify-between">
                            Kategori Kekerasan
                        </h3>
                        <div className="space-y-2.5">
                            {categoryStatsArr.length === 0 ? (
                                <div className="text-xs text-muted-foreground py-4 text-center">Belum ada data</div>
                            ) : (
                                categoryStatsArr.map(([key, count]) => (
                                    <div key={key} className="flex flex-col gap-0.5 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-[11px] truncate pr-2">{key === "Kekerasan Psikis / Emosional" ? "Psikis / Emosional" : key}</span>
                                            <span className="text-[11px] font-medium">{count}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full bg-panic/80 transition-all ${count === 0 ? 'hidden' : ''}`}
                                                style={{ width: `${Math.max(3, (count / Math.max(1, __all.length)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
