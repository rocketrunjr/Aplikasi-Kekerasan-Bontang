"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function MenungguPersetujuanPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                },
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-teal/5 px-4 py-12">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 shadow-sm relative">
                    <Clock className="h-10 w-10 text-amber-500 absolute" />
                    <div className="absolute top-0 right-0 rounded-full bg-background p-1 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                </div>

                <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Menunggu Persetujuan
                </h1>

                <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm mt-6 text-left">
                    <p className="text-muted-foreground leading-relaxed">
                        Akun Anda berhasil didaftarkan, namun saat ini <strong>status akun Anda masih menunggu persetujuan (approval)</strong> dari Administrator sistem Si SAKA.
                    </p>
                    <div className="mt-4 rounded-xl bg-primary/5 p-4 border border-primary/10">
                        <p className="text-sm font-medium text-primary">
                            Mengapa perlu persetujuan?
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Untuk menjaga keamanan dan kerahasiaan data korban, hanya petugas resmi yang telah divalidasi identitasnya yang dapat mengakses Dashboard Petugas.
                        </p>
                    </div>
                    <p className="mt-6 text-sm text-foreground font-medium">
                        Silakan hubungi Administrator Si SAKA untuk mempercepat proses validasi akun Anda.
                    </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto gap-2 rounded-xl shadow-sm"
                    >
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full sm:w-auto gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar / Ganti Akun
                    </Button>
                </div>
            </div>
        </div>
    );
}
