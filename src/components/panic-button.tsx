"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/turnstile";
import { getDeviceLocation } from "@/lib/location";

interface PanicButtonProps {
    onClick?: () => void;
}

export function PanicButton({ onClick }: PanicButtonProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [sending, setSending] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [wasInCooldown, setWasInCooldown] = useState(false);

    useEffect(() => {
        setMounted(true);
        const lastPanic = localStorage.getItem("last_panic_time");
        if (lastPanic) {
            const timePassed = Math.floor((Date.now() - parseInt(lastPanic)) / 1000);
            if (timePassed < 60) {
                setCooldown(60 - timePassed);
                setWasInCooldown(true);
            }
        }
    }, []);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (cooldown === 0 && wasInCooldown) {
            window.location.reload();
        }
    }, [cooldown, wasInCooldown]);

    async function handlePanic() {
        if (cooldown > 0) {
            setErrorMsg(`Harap tunggu... Silakan coba lagi setelah ${cooldown} detik.`);
            return;
        }
        if (sending) return;
        if (!turnstileToken) {
            setErrorMsg("Menunggu verifikasi keamanan. Silakan coba sebentar lagi.");
            return;
        }

        setSending(true);
        setErrorMsg("");

        try {
            // 1. Capture GPS location — fallback to Bontang center if unavailable
            const BONTANG_LAT = 0.1217;
            const BONTANG_LNG = 117.4999;

            let latitude = BONTANG_LAT;
            let longitude = BONTANG_LNG;

            try {
                const pos = await getDeviceLocation();
                latitude = pos.latitude;
                longitude = pos.longitude;
            } catch (err: unknown) {
                const error = err as Error;
                console.warn("GPS failed, showing warning before fallback:", error.message);
                const proceed = window.confirm(`PERINGATAN LOKASI:\n${error.message}\n\nJika Anda LANJUTKAN, laporan akan tetap dikirim namun menggunakan titik default (pusat kota).\n\nTetap teruskan pesan darurat ini?`);
                if (!proceed) {
                    setSending(false);
                    return;
                }
            }

            // 2. Create panic report via API
            const reportRes = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    victimName: "Pelapor Anonim",
                    reportType: "PANIC_BUTTON",
                    violenceCategory: "Darurat",
                    description: "Laporan darurat melalui tombol panik",
                    latitude,
                    longitude,
                    turnstileToken,
                }),
            });

            const data = await reportRes.json();

            if (!reportRes.ok) {
                if (reportRes.status === 429) {
                    throw new Error("Terlalu banyak permintaan darurat. Harap tunggu.");
                }
                throw new Error(data.error || "Gagal mengirim laporan darurat");
            }

            // Save successful request time for cooldown
            localStorage.setItem("last_panic_time", Date.now().toString());
            setCooldown(60);
            setWasInCooldown(true);

            // 3. Callback + redirect on SUCCESS only
            onClick?.();
            router.push("/darurat");
        } catch (error) {
            console.error("Panic button error:", error);
            const errParam = error as Error;
            
            if (errParam.message && errParam.message.includes("Terlalu banyak permintaan")) {
                localStorage.setItem("last_panic_time", Date.now().toString());
                setCooldown(60);
                setWasInCooldown(true);
                setErrorMsg("Terlalu banyak permintaan darurat. Silakan tunggu 60 detik.");
            } else {
                setErrorMsg(errParam.message || "Gagal mengirim laporan darurat.");
            }

            // Reset Turnstile token so they can try again
            setTurnstileToken(null);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex flex-col items-center">
            {errorMsg && (
                <div className="mb-4 text-center text-sm font-medium text-destructive">
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handlePanic}
                disabled={sending || !turnstileToken || cooldown > 0}
                className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-panic/90 to-panic shadow-lg shadow-panic/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-panic/30 active:scale-95 disabled:opacity-80 sm:h-48 sm:w-48"
                aria-label="Tombol Panik — Kirim peringatan darurat"
            >
                {/* Pulsing ring animation */}
                <span className="absolute inset-0 animate-ping rounded-full bg-panic/20" />
                <span className="panic-pulse-delay absolute inset-0 animate-pulse rounded-full bg-panic/10" />

                {/* Inner circle */}
                <span className="relative z-10 flex flex-col items-center gap-2">
                    {sending ? (
                        <Loader2 className="h-10 w-10 animate-spin text-white sm:h-12 sm:w-12" />
                    ) : (
                        <AlertTriangle className="h-10 w-10 text-white drop-shadow-md sm:h-12 sm:w-12" />
                    )}
                    <span className="text-lg font-extrabold uppercase tracking-wider text-white drop-shadow-md sm:text-xl">
                        {cooldown > 0 ? `${cooldown}s` : sending ? "Mengirim..." : "Darurat"}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">
                        {cooldown > 0 ? "Menunggu Jeda" : sending ? "Mengambil lokasi GPS" : "Tekan untuk bantuan"}
                    </span>
                </span>
            </button>

            {/* Turnstile auto-solves in the background */}
            {mounted && (
                <div className="mt-4">
                    <Turnstile
                        size="invisible"
                        onVerify={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken(null)}
                        onError={() => setErrorMsg("Gagal memuat sistem anti-spam")}
                    />
                </div>
            )}
        </div>
    );
}
