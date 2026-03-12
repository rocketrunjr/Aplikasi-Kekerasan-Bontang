"use client";

import { X } from "lucide-react";

export function QuickExitButton() {
    const handleQuickExit = () => {
        // Replace current history entry so pressing back doesn't return here
        window.location.replace("https://www.google.com");
    };

    return (
        <button
            onClick={handleQuickExit}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:bottom-auto sm:top-4 z-[100] flex items-center gap-1.5 rounded-full bg-muted/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-destructive hover:text-white hover:shadow-md"
            aria-label="Keluar Cepat — Tutup halaman ini"
            title="Keluar Cepat"
        >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar Cepat</span>
        </button>
    );
}
