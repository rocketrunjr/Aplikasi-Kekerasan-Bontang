"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                {/* Logo / Brand — neutral per PRD §8 (discreet) */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight tracking-tight text-foreground">
                            Si SAKA
                        </span>
                        <span className="text-[10px] leading-tight text-muted-foreground">
                            Layanan Masyarakat
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-4 md:flex">
                    <Link
                        href="/"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        Beranda
                    </Link>
                    <Link
                        href="/laporan"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        Buat Laporan
                    </Link>
                    <ThemeToggle />
                    <Link
                        href="/login"
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
                    >
                        Masuk Petugas
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <button
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menu navigasi"
                    >
                        {menuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="border-t border-border/50 bg-background px-4 pb-4 pt-2 md:hidden">
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/"
                            onClick={() => setMenuOpen(false)}
                            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            Beranda
                        </Link>
                        <Link
                            href="/laporan"
                            onClick={() => setMenuOpen(false)}
                            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            Buat Laporan
                        </Link>
                        <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className="mt-1 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                        >
                            Masuk Petugas
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
