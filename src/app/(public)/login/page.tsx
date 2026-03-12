"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Turnstile } from "@/components/turnstile";


export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!captchaToken) {
            setError("Mohon selesaikan verifikasi keamanan (Captcha)");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Check brute force & verify captcha, and perform authentication
            const res = await fetch("/api/auth/login-secure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, token: captchaToken, rememberMe }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Gagal verifikasi keamanan atau akun terkunci");
                setLoading(false);
                return;
            }

            // Success, router will redirect based on middleware or we push
            router.push("/dashboard");
        } catch (err) {
            console.error("Login Error:", err);
            setError("Terjadi kesalahan. Silakan coba lagi.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-teal/5 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                        <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                        Si SAKA Admin
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Masuk ke Dashboard Petugas
                    </p>
                </div>

                {/* Login Form */}
                <form
                    onSubmit={handleLogin}
                    className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
                >
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
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
                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
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

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="rememberMe"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
                                Ingatkan Saya
                            </Label>
                        </div>

                        <div className="pt-2" style={{ display: password.length > 0 ? "block" : "none" }}>
                            <Turnstile
                                onVerify={(token) => setCaptchaToken(token)}
                                onError={() => setError("Error loading captcha")}
                                onExpire={() => setCaptchaToken("")}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full gap-2 rounded-xl bg-primary py-2.5 shadow-md shadow-primary/20"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Memproses...
                            </span>
                        ) : (
                            <>
                                <LogIn className="h-4 w-4" />
                                Masuk
                            </>
                        )}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm font-medium">
                    Belum memiliki akun?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Daftar Baru
                    </Link>
                </p>
            </div>
        </div>
    );
}
