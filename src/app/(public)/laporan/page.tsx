"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Send, MapPin, Calendar, FileUp, Loader2, Users } from "lucide-react";
import { Turnstile } from "@/components/turnstile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const violenceTypes = [
    { id: "fisik", label: "Kekerasan Fisik" },
    { id: "psikis", label: "Kekerasan Psikis / Emosional" },
    { id: "seksual", label: "Kekerasan Seksual" },
    { id: "ekonomi", label: "Kekerasan Ekonomi" },
    { id: "penelantaran", label: "Penelantaran" },
    { id: "lainnya", label: "Lainnya" },
];

export default function LaporanPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        location: "",
        date: "",
        time: "",
        violenceCategories: [] as string[],
        description: "",
        evidence: null as File | null,
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

    const handleSubmit = async () => {
        if (!captchaToken) {
            setError("Mohon selesaikan verifikasi keamanan (Captcha)");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // 1. Verify captcha
            const captchaRes = await fetch("/api/captcha/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: captchaToken }),
            });
            const captchaResult = await captchaRes.json();

            if (!captchaResult.success) {
                throw new Error("Verifikasi keamanan gagal");
            }

            // Capture GPS — fallback to Bontang center if unavailable
            const BONTANG_LAT = 0.1217;
            const BONTANG_LNG = 117.4999;

            let latitude = BONTANG_LAT;
            let longitude = BONTANG_LNG;

            try {
                const position = await Promise.race([
                    new Promise<GeolocationPosition>((resolve, reject) => {
                        if (!navigator.geolocation) {
                            reject(new Error("not supported"));
                            return;
                        }
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 5000,
                        });
                    }),
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error("GPS timeout fallback")), 20000)
                    )
                ]);
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch {
                console.warn("GPS unavailable or timed out, using fallback Bontang coordinates");
            }

            // 2. Submit report
            const reportRes = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    victimName: formData.contactName || "Anonim",
                    reportType: "FORM",
                    violenceCategory: formData.violenceCategories.join(", "),
                    description: formData.description,
                    latitude,
                    longitude,
                    locationInfo: formData.location, // Note: not mapped in schema, but we pass description
                    jenisKelamin: formData.jenisKelamin,
                    kategoriKorban: formData.kategoriKorban,
                    rentangUsia: formData.rentangUsia,
                    contactPhone: formData.contactPhone || null,
                }),
            });

            if (!reportRes.ok) {
                throw new Error("Gagal mengirim laporan. Silakan coba lagi.");
            }

            await reportRes.json();

            router.push("/darurat"); // Reuse darurat success page for now or create a dedicated success page
        } catch (err: unknown) {
            console.error("Submit error:", err);
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const canProceedStep1 = formData.location && formData.date;
    const canProceedStep2 =
        formData.violenceCategories.length > 0 && formData.description && formData.jenisKelamin && formData.kategoriKorban && formData.rentangUsia;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Formulir Pengaduan
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Langkah {step} dari {totalSteps} — Isi sesuai kemampuan Anda
                </p>
                <Progress value={progress} className="mt-4 h-2" />
            </div>

            {/* Step Content */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
                {/* Step 1: Location & Time */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary">
                            <MapPin className="h-5 w-5" />
                            <h2 className="text-lg font-bold">Lokasi & Waktu Kejadian</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Berikan informasi tentang di mana dan kapan kejadian terjadi.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Lokasi Kejadian</Label>
                                <Input
                                    id="location"
                                    placeholder="Contoh: Jl. Merdeka No. 10, Surabaya"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            location: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">
                                        <Calendar className="mr-1 inline h-3.5 w-3.5" />
                                        Tanggal
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                date: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Waktu (opsional)</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                time: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Violence Type & Description */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-lg font-bold">Jenis Kekerasan & Kronologi</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Pilih jenis kekerasan yang dialami. Anda boleh memilih lebih dari
                            satu.
                        </p>

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

                        <div className="space-y-4 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Users className="h-4 w-4" /> Demografi Korban
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Jenis Kelamin</Label>
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
                                    <Label>Kategori Korban</Label>
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
                                    <Label>Rentang Usia</Label>
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

                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <Label htmlFor="description">Kronologi Kejadian</Label>
                            <Textarea
                                id="description"
                                placeholder="Ceritakan secara singkat apa yang terjadi..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                className="min-h-32 rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tulis sesuai kemampuan Anda. Tidak harus lengkap.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Evidence & Contact */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary">
                            <FileUp className="h-5 w-5" />
                            <h2 className="text-lg font-bold">Bukti & Kontak</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Unggah bukti pendukung (opsional) dan berikan kontak yang bisa
                            dihubungi.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Unggah Bukti (Opsional)</Label>
                                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/70 p-8 transition-colors hover:border-primary/30 hover:bg-muted/20">
                                    <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                                        <FileUp className="h-8 w-8 text-muted-foreground/50" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {formData.evidence
                                                ? formData.evidence.name
                                                : "Klik untuk memilih foto / dokumen"}
                                        </span>
                                        <span className="text-xs text-muted-foreground/50">
                                            JPG, PNG, PDF (maks. 10MB)
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    evidence: e.target.files?.[0] ?? null,
                                                }))
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactName">
                                    Nama Kontak <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="contactName"
                                    placeholder="Nama Anda atau pihak yang bisa dihubungi"
                                    value={formData.contactName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            contactName: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">
                                    No. Telepon / WA <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="contactPhone"
                                    type="tel"
                                    placeholder="08xxxxxxxxxx"
                                    value={formData.contactPhone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            contactPhone: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>

                            {error && !error.includes("GPS") && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 flex text-sm text-destructive font-medium">
                                    {error}
                                </div>
                            )}

                            {error && error.includes("GPS") && (
                                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
                                    <h3 className="mb-1 text-sm font-bold text-destructive">Akses Lokasi Diblokir</h3>
                                    <p className="text-xs leading-relaxed text-destructive/90">
                                        Sistem mengidentifikasi bahwa akses Lokasi (GPS) tidak diizinkan. Silakan klik ikon gembok <strong>(🔒)</strong> di baris URL browser Anda atas, pilih <strong>Izin (Permissions)</strong>, lalu nyalakan <strong>Lokasi (Location)</strong> untuk melanjutkan.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2">
                                <Label className="mb-2 block">Verifikasi Keamanan (Otomatis)</Label>
                                <div className="mt-1">
                                    <Turnstile
                                        size="invisible"
                                        onVerify={(token) => setCaptchaToken(token)}
                                        onError={() => setError("Error loading captcha")}
                                        onExpire={() => setCaptchaToken("")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="gap-2 rounded-xl text-muted-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < totalSteps ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={
                                (step === 1 && !canProceedStep1) ||
                                (step === 2 && !canProceedStep2)
                            }
                            className="gap-2 rounded-xl bg-primary px-6 shadow-md shadow-primary/20"
                        >
                            Lanjutkan
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !captchaToken || !formData.contactName || !formData.contactPhone}
                            className="gap-2 rounded-xl bg-teal px-6 text-teal-foreground shadow-md shadow-teal/20"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {submitting ? "Mengirim..." : "Kirim Laporan"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Privacy Note */}
            <p className="mt-6 text-center text-xs text-muted-foreground/60">
                🔒 Semua data Anda dienkripsi dan nama akan disamarkan secara otomatis.
            </p>
        </div>
    );
}
