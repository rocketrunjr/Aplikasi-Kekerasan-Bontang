"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const validatePassword = (pass: string) => {
        const minLength = 8;
        const hasUpper = /[A-Z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        return pass.length >= minLength && hasUpper && hasNumber && hasSymbol;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validatePassword(password)) {
            setError(
                "Kata sandi harus minimal 8 karakter, mengandung huruf besar, angka, dan simbol."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Konfirmasi kata sandi tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await signUp.email({
                email,
                password,
                name,
                // @ts-expect-error: custom fields from BetterAuth config
                role: "petugas", // Hardcode role for public registration
                phone,
                location,
            });

            if (signUpError) {
                setError(signUpError.message || "Gagal mendaftar. Email mungkin sudah digunakan.");
                setLoading(false);
                return;
            }

            // Success, push to approval waiting area
            router.push("/menunggu-persetujuan");
        } catch (err) {
            console.error("Register Error:", err);
            setError("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-teal/5 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                        <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-foreground text-center">
                        Daftar Akun Petugas Baru
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground text-center">
                        Silakan isi formulir di bawah ini. Akun yang didaftarkan akan divalidasi oleh Administrator.
                    </p>
                </div>

                {/* Register Form */}
                <form
                    onSubmit={handleRegister}
                    className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
                >
                    {error && (
                        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                placeholder="Cth: Budi Prasetyo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="petugas@sisaka.id"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">ID Telegram <span className="text-destructive">*</span></Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    placeholder="Cth: 12345678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Wilayah Tugas <span className="text-destructive">*</span></Label>
                                <Input
                                    id="location"
                                    placeholder="Cth: Bontang Utara"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <Label htmlFor="password">Kata Sandi <span className="text-destructive">*</span></Label>
                            <p className="text-xs text-muted-foreground mb-1">
                                Minimal 8 karakter, wajib huruf besar, angka, dan simbol.
                            </p>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full gap-2 rounded-xl bg-primary py-2.5 shadow-md shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="h-4 w-4" />
                        )}
                        {loading ? "Mendaftar..." : "Daftar Akun"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm font-medium">
                    Sudah memiliki akun?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}
