"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Link as LinkIcon, Settings2, ShieldCheck } from "lucide-react";

export default function PengaturanPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Form state
    const [appName, setAppName] = useState("");
    const [appLogoUrl, setAppLogoUrl] = useState("");
    const [heroHeadline, setHeroHeadline] = useState("");
    const [heroSubheadline, setHeroSubheadline] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [footerText, setFooterText] = useState("");
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setAppName(data.appName || "");
                    setAppLogoUrl(data.appLogoUrl || "");
                    setHeroHeadline(data.heroHeadline || "");
                    setContactEmail(data.contactEmail || "");
                    setContactPhone(data.contactPhone || "");
                    setFooterText(data.footerText || "");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load settings:", err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg("");

        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appName,
                    appLogoUrl,
                    heroHeadline,
                    heroSubheadline,
                    contactEmail,
                    contactPhone,
                    footerText
                })
            });

            if (res.ok) {
                setSuccessMsg("Pengaturan berhasil disimpan.");
                setTimeout(() => setSuccessMsg(""), 3000);
            }
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                setAppLogoUrl(data.url);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
                    <Settings2 className="h-8 w-8 text-primary" />
                    Pengaturan Sistem
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Kelola identitas aplikasi, konten halaman utama, dan informasi kontak.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Identitas Section */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                        <ShieldCheck className="h-5 w-5 text-teal" />
                        <h2 className="text-lg font-semibold text-foreground">Identitas Aplikasi</h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 relative">
                            <Label htmlFor="appName">Nama Aplikasi</Label>
                            <Input
                                id="appName"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                placeholder="Si SAKA"
                                className="rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoFile">Logo Aplikasi</Label>
                            <div className="flex gap-4 items-center">
                                {appLogoUrl && (
                                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border bg-muted p-1">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={appLogoUrl} alt="Logo" className="h-full w-full object-contain" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <Input
                                        id="logoFile"
                                        type="file"
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                        className="rounded-xl w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Upload gambar logo. Rekomendasi ukuran: 512x512px. Format: PNG, JPG, SVG.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Konten Halaman Utama Section */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                        <LinkIcon className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-foreground">Konten Halaman Utama (Landing Page)</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="heroHeadline">Headline Utama</Label>
                            <Input
                                id="heroHeadline"
                                value={heroHeadline}
                                onChange={(e) => setHeroHeadline(e.target.value)}
                                placeholder="Masukkan judul hero utama"
                                className="rounded-xl font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroSubheadline">Sub-headline (Deskripsi Pendek)</Label>
                            <Textarea
                                id="heroSubheadline"
                                value={heroSubheadline}
                                onChange={(e) => setHeroSubheadline(e.target.value)}
                                placeholder="Tuliskan deskripsi singkat layanan..."
                                className="rounded-xl min-h-[100px] resize-none"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Teks ini akan tampil besar tepat di bawah headline utama di halaman landing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Kontak Section */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-foreground">Informasi Kontak</h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email Bantuan</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="bantuan@sisaka.id"
                                className="rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Nomor Telepon / WhatsApp Darurat</Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="0811xxxxxxxx"
                                className="rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="footerText">Teks Footer (Hak Cipta / Slogan)</Label>
                            <Input
                                id="footerText"
                                value={footerText}
                                onChange={(e) => setFooterText(e.target.value)}
                                placeholder="Platform Layanan Perlindungan Masyarakat"
                                className="rounded-xl"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    {successMsg && (
                        <span className="text-sm font-medium text-teal flex items-center gap-1 animate-in fade-in">
                            <ShieldCheck className="h-4 w-4" />
                            {successMsg}
                        </span>
                    )}
                    <Button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl gap-2 bg-primary px-8 shadow-md shadow-primary/20"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
