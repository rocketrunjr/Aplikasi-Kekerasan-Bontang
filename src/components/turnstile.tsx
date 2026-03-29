"use client";

import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        turnstile?: {
            render: (
                element: HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    "expired-callback"?: () => void;
                    "error-callback"?: () => void;
                    theme?: "light" | "dark" | "auto";
                    size?: "normal" | "compact" | "invisible";
                }
            ) => string;
            remove: (widgetId: string) => void;
            reset: (widgetId: string) => void;
        };
    }
}

interface TurnstileProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact" | "invisible";
}

export function Turnstile({ onVerify, onExpire, onError, theme = "auto", size = "normal" }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && !!window.turnstile);

    useEffect(() => {
        if (loaded) return;
        // Load Turnstile script
        if (!document.getElementById("turnstile-script")) {
            const script = document.createElement("script");
            script.id = "turnstile-script";
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.onload = () => setLoaded(true);
            document.head.appendChild(script);
        }
    }, [loaded]);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
        onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    useEffect(() => {
        if (!loaded || !containerRef.current || !window.turnstile) return;

        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        if (!siteKey) {
            console.error("Turnstile site key not found in environment variables");
            return;
        }
        widgetId.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onVerifyRef.current(token),
            "expired-callback": () => onExpireRef.current?.(),
            "error-callback": () => onErrorRef.current?.(),
            theme,
            size,
        });

        return () => {
            if (widgetId.current && window.turnstile) {
                window.turnstile.remove(widgetId.current);
            }
        };
    }, [loaded, theme, size]);

    return <div ref={containerRef} className={size === "invisible" ? "" : "flex justify-center min-h-[65px]"} />;
}
