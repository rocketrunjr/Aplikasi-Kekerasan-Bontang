"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Download,
    Printer,
    CheckCircle2,
    Calendar,
    MapPin,
    Tag,
    User,
    Camera,
    X,
    ImageIcon,
    Search,
    Save,
    Loader2,
    Phone,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PhotoCategory, Report } from "@/lib/types";

const photoCategories: { key: PhotoCategory; label: string }[] = [
    { key: "LOKASI", label: "Foto Lokasi" },
    { key: "KORBAN", label: "Foto Korban" },
    { key: "PETUGAS", label: "Foto Petugas" },
    { key: "PELAPOR", label: "Foto Pelapor" },
    { key: "PELAKU", label: "Foto Pelaku" },
];

interface UploadedPhoto {
    id: string;
    category: PhotoCategory;
    fileName: string;
    preview: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function LaporanInsidenPage() {
    const session = authClient.useSession();
    const CURRENT_USER = session.data?.user?.id;
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canView, setCanView] = useState(false);
    const [canDownload, setCanDownload] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [selectedReport, setSelectedReport] = useState<string>("");

    useEffect(() => {
        if (!CURRENT_USER) return;

        fetch("/api/reports")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const myCases = data.filter((r) => r.assignedTo === CURRENT_USER);
                    setReports(myCases);
                    const params = new URLSearchParams(window.location.search);
                    const queryId = params.get("id");
                    if (queryId && myCases.some((r: Report) => r.id === queryId)) {
                        setSelectedReport(queryId);
                    } else if (myCases.length > 0) {
                        setSelectedReport(myCases[0].id);
                    }
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
                const myPerms = data.find((p: { userId: string, canViewData: boolean, canExportData: boolean }) => p.userId === CURRENT_USER);
                setCanView(myPerms?.canViewData === true);
                setCanDownload(myPerms?.canExportData === true);
            })
            .catch(console.error);
    }, [CURRENT_USER]);

    const report = reports.find((r) => r.id === selectedReport);

    const [kronologi, setKronologi] = useState("");
    const [tindakan, setTindakan] = useState("");
    const [rekomendasi, setRekomendasi] = useState("");
    const [generated, setGenerated] = useState(false);
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
    const [isFetchingIncident, setIsFetchingIncident] = useState(false);

    useEffect(() => {
        if (!selectedReport) return;

        setIsFetchingIncident(true);
        fetch(`/api/reports/${selectedReport}/incident`)
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => {
                if (data && data.officerName) {
                    setKronologi(data.kronologi || "");
                    setTindakan(data.tindakan || "");
                    setRekomendasi(data.rekomendasi || "");

                    if (data.photos && Array.isArray(data.photos)) {
                        setPhotos(data.photos.map((p: { id: string, category: PhotoCategory, fileName: string, url: string }) => ({
                            id: p.id || `photo-${Date.now()}-${Math.random()}`,
                            category: p.category,
                            fileName: p.fileName,
                            preview: p.url
                        })));
                    } else {
                        setPhotos([]);
                    }
                    setIsSaved(true);
                    setGenerated(true);
                } else {
                    setKronologi("");
                    setTindakan("");
                    setRekomendasi("");
                    setPhotos([]);
                    setIsSaved(false);
                    setGenerated(false);
                }
            })
            .catch(err => {
                console.error("Error fetching incident data", err);
                setKronologi("");
                setTindakan("");
                setRekomendasi("");
                setPhotos([]);
                setIsSaved(false);
                setGenerated(false);
            })
            .finally(() => {
                setIsFetchingIncident(false);
            });

    }, [selectedReport]);

    // Current print timestamp
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);
    const printTimestamp = isMounted ? new Date().toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }) : "";

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleFileSelect = (
        category: PhotoCategory,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const newPhoto: UploadedPhoto = {
                id: `photo-${Date.now()}`,
                category,
                fileName: file.name,
                preview: reader.result as string,
            };
            setPhotos((prev) => [
                ...prev.filter((p) => p.category !== category),
                newPhoto,
            ]);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const removePhoto = (category: PhotoCategory) => {
        setPhotos((prev) => prev.filter((p) => p.category !== category));
    };

    const handleSave = async () => {
        if (!kronologi || !tindakan || !rekomendasi || !report) return;
        setIsSaving(true);
        try {
            const OfficerNameParam = session.data?.user?.name || "Petugas";
            const response = await fetch(`/api/reports/${report.id}/incident`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    officerId: CURRENT_USER,
                    officerName: OfficerNameParam,
                    kronologi,
                    tindakan,
                    rekomendasi,
                    photos: photos.map(p => ({
                        category: p.category,
                        fileName: p.fileName,
                        url: p.preview || "/placeholder.jpg" // mock url since we aren't uploading to S3
                    }))
                })
            });

            if (response.ok) {
                setIsSaved(true);
                setGenerated(true);
            } else {
                alert("Gagal menyimpan laporan insiden.");
            }
        } catch (e) {
            console.error(e);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    <FileText className="h-7 w-7 text-primary" />
                    Laporan Insiden
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Buat laporan insiden resmi dari kasus yang Anda tangani
                </p>
            </div>

            {/* Select report */}
            <div className="max-w-md space-y-2">
                <Label>Pilih Laporan</Label>
                {isLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Memuat laporan yang ditugaskan...</div>
                ) : reports.length === 0 ? (
                    <div className="text-sm rounded-lg bg-red-500/10 text-red-600 px-3 py-2">
                        Belum ada laporan yang ditugaskan kepada Anda.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="relative border-b pb-2 mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari ID laporan atau opsi nama korban..."
                                className="pl-9 h-10 w-full rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedReport} onValueChange={setSelectedReport}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Pilih Laporan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-[250px]">
                                {reports.filter(r => {
                                    if (!searchQuery) return true;
                                    const q = searchQuery.toLowerCase();
                                    return r.id.toLowerCase().includes(q) || r.victimName.toLowerCase().includes(q) || r.maskedName.toLowerCase().includes(q);
                                }).map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                        {r.id} — {canView ? r.victimName : r.maskedName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {report && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Auto-filled data */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-card-foreground">
                            Data Otomatis (dari Sistem)
                        </h2>
                        <Separator className="my-4" />
                        <div className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">ID Laporan</p>
                                    <p className="font-mono font-medium text-card-foreground">
                                        {report.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Korban {canView ? "" : "(Masked)"}</p>
                                    <p className="font-medium text-card-foreground">
                                        {canView ? report.victimName : report.maskedName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Lokasi</p>
                                    <p className="font-medium text-card-foreground">
                                        {report.kelurahan}, {report.kecamatan}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Tanggal Laporan</p>
                                    <p className="font-medium text-card-foreground">
                                        {formatDate(report.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Kategori</p>
                                    <p className="font-medium text-card-foreground">
                                        {report.violenceCategory}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Jenis Kelamin Korban</p>
                                    <p className="font-medium text-card-foreground">
                                        {report.jenisKelamin || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Rentang Usia Korban</p>
                                    <p className="font-medium text-card-foreground">
                                        {report.rentangUsia || "-"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Telepon Pelapor</p>
                                    <p className="font-medium text-card-foreground">
                                        {report.contactPhone || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Officer input */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                                Input Petugas
                                {isFetchingIncident && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </h2>
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="kronologi">Kronologi Penanganan</Label>
                                    <textarea
                                        id="kronologi"
                                        value={kronologi}
                                        onChange={(e) => setKronologi(e.target.value)}
                                        rows={3}
                                        placeholder="Deskripsikan kronologi penanganan..."
                                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tindakan">Tindakan yang Diambil</Label>
                                    <textarea
                                        id="tindakan"
                                        value={tindakan}
                                        onChange={(e) => setTindakan(e.target.value)}
                                        rows={3}
                                        placeholder="Daftar tindakan yang dilakukan..."
                                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rekomendasi">Rekomendasi</Label>
                                    <textarea
                                        id="rekomendasi"
                                        value={rekomendasi}
                                        onChange={(e) => setRekomendasi(e.target.value)}
                                        rows={2}
                                        placeholder="Rekomendasi tindak lanjut..."
                                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-card-foreground">
                                <Camera className="h-4 w-4 text-primary" />
                                Upload Foto (Opsional)
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Upload foto dokumentasi pendukung laporan
                            </p>
                            <Separator className="my-4" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                {photoCategories.map((cat) => {
                                    const existing = photos.find(
                                        (p) => p.category === cat.key
                                    );
                                    return (
                                        <div
                                            key={cat.key}
                                            className="relative rounded-xl border border-dashed border-border p-3"
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={(el) => {
                                                    fileInputRefs.current[cat.key] = el;
                                                }}
                                                onChange={(e) => handleFileSelect(cat.key, e)}
                                                aria-label={cat.label}
                                            />
                                            {existing ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-muted">
                                                        <ImageIcon className="h-5 w-5 text-teal" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="truncate text-xs font-medium text-card-foreground">
                                                            {cat.label}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {existing.fileName}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removePhoto(cat.key)}
                                                        className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                        title={`Hapus ${cat.label}`}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        fileInputRefs.current[cat.key]?.click()
                                                    }
                                                    className="flex w-full items-center gap-3 text-left"
                                                    title={`Upload ${cat.label}`}
                                                >
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                                        <Camera className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-card-foreground">
                                                            {cat.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Klik untuk upload
                                                        </p>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {photos.length > 0 && (
                                <p className="mt-3 text-xs text-teal">
                                    ✓ {photos.length} foto terlampir
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !kronologi || !tindakan || !rekomendasi}
                            className="w-full gap-2 rounded-xl bg-primary shadow-md shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaved ? "Tersimpan" : "Simpan & Generate Laporan"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Generated Preview */}
            {generated && report && (
                <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-sm">
                    <div className="mx-auto max-w-2xl">
                        <div className="text-center">
                            <h2 className="text-lg font-extrabold text-card-foreground">
                                LAPORAN INSIDEN RESMI
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Sistem Informasi Si SAKA — Kota Bontang
                            </p>
                            <Separator className="my-4" />
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Nomor Laporan</p>
                                    <p className="font-mono font-bold">{report.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tanggal Insiden</p>
                                    <p className="font-medium">{formatDate(report.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Korban</p>
                                    <p className="font-medium">{canView ? report.victimName : report.maskedName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Lokasi</p>
                                    <p className="font-medium">
                                        {report.kelurahan}, {report.kecamatan}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Kategori</p>
                                    <p className="font-medium">{report.violenceCategory}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Jenis Kelamin</p>
                                    <p className="font-medium">{report.jenisKelamin || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Rentang Usia</p>
                                    <p className="font-medium">{report.rentangUsia || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Petugas</p>
                                    <p className="font-medium">{session.data?.user?.name || "Petugas"}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="mb-1 font-bold text-card-foreground">
                                    Kronologi Penanganan
                                </h3>
                                <p className="whitespace-pre-line text-muted-foreground">
                                    {kronologi}
                                </p>
                            </div>

                            <div>
                                <h3 className="mb-1 font-bold text-card-foreground">
                                    Tindakan yang Diambil
                                </h3>
                                <p className="whitespace-pre-line text-muted-foreground">
                                    {tindakan}
                                </p>
                            </div>

                            <div>
                                <h3 className="mb-1 font-bold text-card-foreground">
                                    Rekomendasi
                                </h3>
                                <p className="whitespace-pre-line text-muted-foreground">
                                    {rekomendasi}
                                </p>
                            </div>

                            {/* Photo Attachments in Preview */}
                            {photos.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="mb-2 font-bold text-card-foreground">
                                            Lampiran Foto
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {photos.map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className="rounded-xl border border-border overflow-hidden"
                                                >
                                                    <div className="aspect-video bg-muted flex items-center justify-center">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-medium text-card-foreground">
                                                            {photoCategories.find(
                                                                (c) => c.key === photo.category
                                                            )?.label}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {photo.fileName}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Digenerate otomatis oleh Si SAKA pada{" "}
                                    {new Date().toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-teal" />
                                    Terverifikasi
                                </span>
                            </div>
                        </div>

                        {canDownload && (
                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="outline"
                                    className="gap-2 rounded-xl"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4" />
                                    Cetak
                                </Button>
                                <Button variant="outline" className="gap-2 rounded-xl">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PRINT ONLY SECTION */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    #printable-section, #printable-section * { visibility: visible; }
                    #printable-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; background: white; color: black; padding: 20px; }
                    @page { margin: 1.5cm; }
                }
            `}} />
            <div id="printable-section" className="hidden print:block font-sans">
                {generated && report ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-teal-600" />
                                <h1 className="text-2xl font-bold text-slate-900">Laporan Insiden Petugas</h1>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-semibold">Terisi</span>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <p className="font-semibold text-slate-500 mb-1">ID Laporan</p>
                                <p className="font-medium text-slate-900">{report.id}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 mb-1">Tanggal Insiden</p>
                                <p className="font-medium text-slate-900">
                                    {formatDate(report.createdAt)}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 mb-1">Petugas (Penulis Laporan)</p>
                                <p className="font-medium text-slate-900">{session.data?.user?.name || "Petugas"}</p>
                            </div>
                        </div>
                        
                        <div className="my-6 border-t border-slate-200"></div>

                        {/* Demografi & Pelapor */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-3">Data Korban & Pelapor</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Korban</p>
                                    <p className="font-medium text-slate-900">{report.maskedName} <span className="text-xs text-slate-400 font-normal">(Disensor)</span></p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Telepon Pelapor</p>
                                    <p className="font-medium text-slate-900">{report.contactPhone || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kategori Kekerasan</p>
                                    <p className="font-medium text-slate-900">{report.violenceCategory}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kategori Korban</p>
                                    <p className="font-medium text-slate-900">{report.kategoriKorban || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jenis Kelamin</p>
                                    <p className="font-medium text-slate-900">{report.jenisKelamin || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rentang Usia</p>
                                    <p className="font-medium text-slate-900">{report.rentangUsia || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Laporan Content */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Kronologi Penanganan</h3>
                                <div className="rounded-xl bg-slate-50 p-4 text-slate-800 text-sm whitespace-pre-line border border-slate-100">
                                    {kronologi}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Tindakan Yang Diambil</h3>
                                <div className="rounded-xl bg-slate-50 p-4 text-slate-800 text-sm whitespace-pre-line border border-slate-100">
                                    {tindakan}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Rekomendasi</h3>
                                <div className="rounded-xl bg-slate-50 p-4 text-slate-800 text-sm whitespace-pre-line border border-slate-100">
                                    {rekomendasi}
                                </div>
                            </div>
                        </div>

                        {/* Watermark/Footer */}
                        <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-slate-400">
                            <p>Dokumen ini dicetak dari Sistem Informasi Si SAKA Kota Bontang.</p>
                            <p>Dicetak oleh: <span className="font-medium text-slate-600">{session.data?.user?.name || session.data?.user?.email || "Petugas"}</span></p>
                            <p>Waktu Cetak: <span className="font-medium text-slate-600">{printTimestamp}</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <h2 className="text-xl font-bold text-slate-800">Laporan Insiden Belum Diisi</h2>
                        <p className="text-slate-500">Petugas belum mengisi atau menyimpan laporan insiden untuk kasus ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
