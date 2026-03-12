"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

// Inactivity timeout in milliseconds (10 minutes)
const TIMEOUT_MS = 10 * 60 * 1000;

export function AutoLogout() {
    const { data: session } = useSession();
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        if (!session) return;

        await signOut();
        router.push("/login?timeout=true");
    }, [session, router]);

    const resetTimer = useCallback(() => {
        if (!session) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Use Node/Window timer correctly depending on environment
        timerRef.current = setTimeout(handleLogout, TIMEOUT_MS) as ReturnType<typeof setTimeout>;
    }, [handleLogout, session]);

    useEffect(() => {
        if (!session) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // Initialize timer
        resetTimer();

        // Listen for user activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [session, resetTimer]);

    return null; // This is a logic-only component
}
