"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, MapPin, FileUp, Loader2, ArrowLeft, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const violenceTypes = [
    { id: "fisik", label: "Kekerasan Fisik" },
    { id: "psikis", label: "Kekerasan Psikis / Emosional" },
    { id: "seksual", label: "Kekerasan Seksual" },
    { id: "ekonomi", label: "Kekerasan Ekonomi" },
    { id: "penelantaran", label: "Penelantaran" },
    { id: "lainnya", label: "Lainnya" },
];

export function ManualReportForm({ backUrl = "/dashboard/laporan" }: { backUrl?: string }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        location: "",
        date: "",
        time: "",
        violenceCategories: [] as string[],
        description: "",
        contactName: "",
        contactPhone: "",
        jenisKelamin: "",
        kategoriKorban: "",
        rentangUsia: "",
    });

    const handleCategoryToggle = (categoryId: string) => {
        setFormData((prev) => ({
            ...prev,
            violenceCategories: prev.violenceCategories.includes(categoryId)
                ? prev.violenceCategories.filter((c) => c !== categoryId)
                : [...prev.violenceCategories, categoryId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.location || !formData.date || formData.violenceCategories.length === 0 || !formData.description || !formData.jenisKelamin || !formData.kategoriKorban || !formData.rentangUsia) {
            setError("Mohon lengkapi semua field yang diwajibkan.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // Capture GPS — fallback to Bontang center if unavailable
            const BONTANG_LAT = 0.1217;
            const BONTANG_LNG = 117.4999;

            let latitude = BONTANG_LAT;
            let longitude = BONTANG_LNG;

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error("not supported"));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 60000,
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch {
                console.warn("GPS unavailable, using fallback Bontang coordinates");
            }

            // Direct submission to reports API (bypass captcha since user is authenticated)
            const reportRes = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    victimName: formData.contactName || "Anonim (Input Manual)",
                    reportType: "FORM",
                    violenceCategory: formData.violenceCategories.join(", "),
                    jenisKelamin: formData.jenisKelamin,
                    kategoriKorban: formData.kategoriKorban,
                    rentangUsia: formData.rentangUsia,
                    contactPhone: formData.contactPhone || null,
                    description: `[Manual Input] Tanggal Kejadian: ${formData.date} ${formData.time}\nLokasi: ${formData.location}\nKontak: ${formData.contactPhone}\n\nKronologi:\n${formData.description}`,
                    latitude,
                    longitude,
                    locationInfo: formData.location,
                }),
            });

            if (!reportRes.ok) {
                throw new Error("Gagal mengirim laporan. Silakan coba lagi.");
            }

            // Route back
            router.push(backUrl);
            router.refresh();
        } catch (err: unknown) {
            console.error("Submit error:", err);
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => router.push(backUrl)}
                    className="rounded-xl"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Buat Laporan Manual
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Tambahkan kasus pengaduan secara manual ke dalam sistem.
                    </p>
                </div>
            </div>

            {error && !error.includes("GPS") && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
                    {error}
                </div>
            )}

            {error && error.includes("GPS") && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
                    <h3 className="mb-1 text-sm font-bold text-destructive">Akses Lokasi Diblokir</h3>
                    <p className="text-xs leading-relaxed text-destructive/90">
                        Sistem mengidentifikasi bahwa akses Lokasi (GPS) ditolak. Silakan buka pengaturan situs / ikon gembok <strong>(🔒)</strong> di kiri atas browser, lalu izinkan akses <strong>Lokasi (Location)</strong> dan coba simpan lagi.
                    </p>
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <MapPin className="h-4 w-4" /> Lokasi & Waktu
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Lokasi Kejadian <span className="text-destructive">*</span></Label>
                        <Input
                            id="location"
                            placeholder="Contoh: Jl. Merdeka No. 10..."
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            className="rounded-xl"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Tanggal <span className="text-destructive">*</span></Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className="rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Waktu (Opsional)</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Jenis & Kronologi
                    </div>

                    <Label>Kategori Kekerasan <span className="text-destructive">*</span></Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {violenceTypes.map((type) => (
                            <label
                                key={type.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all ${formData.violenceCategories.includes(type.id)
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                    }`}
                            >
                                <Checkbox
                                    checked={formData.violenceCategories.includes(type.id)}
                                    onCheckedChange={() => handleCategoryToggle(type.id)}
                                />
                                <span className="text-sm font-medium">{type.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Kronologi Singkat <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="description"
                            placeholder="Deskripsikan kasus..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="min-h-32 rounded-xl"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <Users className="h-4 w-4" /> Demografi Korban
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
                            <Select value={formData.jenisKelamin} onValueChange={(val) => setFormData(prev => ({ ...prev, jenisKelamin: val }))}>
                                <SelectTrigger className="rounded-xl bg-background">
                                    <SelectValue placeholder="Pilih..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Kategori Korban <span className="text-destructive">*</span></Label>
                            <Select value={formData.kategoriKorban} onValueChange={(val) => setFormData(prev => ({ ...prev, kategoriKorban: val }))}>
                                <SelectTrigger className="rounded-xl bg-background">
                                    <SelectValue placeholder="Pilih..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Anak">Anak</SelectItem>
                                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Rentang Usia <span className="text-destructive">*</span></Label>
                            <Select value={formData.rentangUsia} onValueChange={(val) => setFormData(prev => ({ ...prev, rentangUsia: val }))}>
                                <SelectTrigger className="rounded-xl bg-background">
                                    <SelectValue placeholder="Pilih..." />
                                </SelectTrigger>
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
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                        <FileUp className="h-4 w-4" /> Kontak Korban/Pelapor
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Nama (Opsional)</Label>
                            <Input
                                id="contactName"
                                placeholder="Kosongkan jika anonim"
                                value={formData.contactName}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">No. Telepon (Opsional)</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push(backUrl)}
                    className="rounded-xl"
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 rounded-xl bg-teal px-6 text-teal-foreground shadow-md shadow-teal/20"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Menyimpan..." : "Simpan Laporan"}
                </Button>
            </div>
        </form>
    );
}
