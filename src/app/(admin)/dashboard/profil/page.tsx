"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Stethoscope, Save, Mail, Phone, MapPin, UserCircle, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/lib/types";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";

export default function ProfilPage() {
    const { data: session } = authClient.useSession();
    const [profile, setProfile] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        role: "ADMIN" as UserRole,
        location: "",
    });

    useEffect(() => {
        if (session?.user) {
            // eslint-disable-next-line
            setProfile({
                id: session.user.id,
                name: session.user.name || "",
                email: session.user.email || "",
                phone: (session.user as Record<string, unknown>).phone as string || "",
                role: ((session.user as Record<string, unknown>).role as string || "ADMIN").toUpperCase() as UserRole,
                location: (session.user as Record<string, unknown>).location as string || "",
            });
        }
    }, [session]);

    const [saved, setSaved] = useState(false);

    // Password change state
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const handleSave = async () => {
        try {
            const res = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: profile.id,
                    name: profile.name,
                    phone: profile.phone,
                    location: profile.location,
                }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePasswordChange = () => {
        setPasswordError("");

        if (!currentPassword) {
            setPasswordError("Password lama wajib diisi");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password baru minimal 6 karakter");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Konfirmasi password tidak cocok");
            return;
        }

        // In production: call API
        setPasswordSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
            setPasswordSaved(false);
            setPasswordDialogOpen(false);
        }, 1500);
    };

    const initials = profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Profil Saya
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Kelola informasi pribadi dan pengaturan akun
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm lg:col-span-1">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="mt-4 text-lg font-bold text-card-foreground">
                            {profile.name}
                        </h2>
                        <span
                            className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${profile.role === "PSIKOLOG"
                                ? "border-teal/20 bg-teal/10 text-teal"
                                : "border-primary/20 bg-primary/10 text-primary"
                                }`}
                        >
                            {profile.role === "PSIKOLOG" ? (
                                <Stethoscope className="h-3 w-3" />
                            ) : (
                                <Shield className="h-3 w-3" />
                            )}
                            {profile.role === "PSIKOLOG" ? "Psikolog" : "Admin"}
                        </span>

                        <Separator className="my-5" />

                        <div className="w-full space-y-3 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">{profile.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {profile.location}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-base font-bold text-card-foreground">
                            <UserCircle className="mr-2 inline h-4 w-4 text-primary" />
                            Informasi Pribadi
                        </h2>
                        <Separator className="my-4" />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="profileName">Nama Lengkap</Label>
                                <Input
                                    id="profileName"
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile((p) => ({ ...p, name: e.target.value }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="profileEmail">Email</Label>
                                <Input
                                    id="profileEmail"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="rounded-xl bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email tidak dapat diubah setelah didaftarkan</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profilePhone">ID Telegram</Label>
                                <Input
                                    id="profilePhone"
                                    type="text"
                                    value={profile.phone}
                                    onChange={(e) =>
                                        setProfile((p) => ({ ...p, phone: e.target.value }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profileLocation">Lokasi</Label>
                                <Input
                                    id="profileLocation"
                                    value={profile.location}
                                    onChange={(e) =>
                                        setProfile((p) => ({ ...p, location: e.target.value }))
                                    }
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-base font-bold text-card-foreground">
                            Pengaturan Akun
                        </h2>
                        <Separator className="my-4" />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-end sm:col-span-2">
                                <Button
                                    variant="outline"
                                    className="gap-2 rounded-xl"
                                    onClick={() => setPasswordDialogOpen(true)}
                                >
                                    <Lock className="h-4 w-4" />
                                    Ubah Password
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-end gap-3">
                        {saved && (
                            <span className="text-sm font-medium text-teal">
                                ✓ Perubahan berhasil disimpan
                            </span>
                        )}
                        <Button
                            onClick={handleSave}
                            className="gap-2 rounded-xl bg-primary px-6 shadow-md shadow-primary/20"
                        >
                            <Save className="h-4 w-4" />
                            Simpan Perubahan
                        </Button>
                    </div>
                </div>
            </div>

            {/* Password Change Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            Ubah Password
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan password lama dan password baru Anda
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Password Lama</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPass ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Masukkan password lama"
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title={showCurrentPass ? "Sembunyikan" : "Tampilkan"}
                                >
                                    {showCurrentPass ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title={showNewPass ? "Sembunyikan" : "Tampilkan"}
                                >
                                    {showNewPass ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password baru"
                                className="rounded-xl"
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                        {passwordSaved && (
                            <p className="flex items-center gap-1 text-sm font-medium text-teal">
                                <CheckCircle2 className="h-4 w-4" />
                                Password berhasil diubah!
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPasswordDialogOpen(false);
                                setPasswordError("");
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                            }}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            className="rounded-xl bg-primary"
                            disabled={passwordSaved}
                        >
                            Simpan Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
