"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@/components/turnstile";

interface PanicButtonProps {
    onClick?: () => void;
}

export function PanicButton({ onClick }: PanicButtonProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [sending, setSending] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    // Fix Hydration mismatch — only render Turnstile on client
    useEffect(() => {
        setMounted(true);
    }, []);

    async function handlePanic() {
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
                const position = await Promise.race([
                    new Promise<GeolocationPosition>((resolve, reject) => {
                        if (!navigator.geolocation) {
                            reject(new Error("not supported"));
                            return;
                        }
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: false,
                            timeout: 10000,
                            maximumAge: 60000,
                        });
                    }),
                    new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error("GPS timeout fallback")), 5000)
                    )
                ]);
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch {
                // GPS unavailable — silently use fallback coordinates (Bontang center)
                console.warn("GPS unavailable or timed out, using fallback Bontang coordinates");
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

            // 3. Callback + redirect on SUCCESS only
            onClick?.();
            router.push("/darurat");
        } catch (error) {
            console.error("Panic button error:", error);
            const errParam = error as Error;
            setErrorMsg(errParam.message || "Gagal mengirim laporan darurat.");

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
                disabled={sending || !turnstileToken}
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
                        {sending ? "Mengirim..." : "Darurat"}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">
                        {sending ? "Mengambil lokasi GPS" : "Tekan untuk bantuan"}
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
