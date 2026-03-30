"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ClipboardList,
    FileText,
    Shield,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth-client";

export function PetugasSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navItems = [
        { label: "Dashboard", href: "/petugas", icon: LayoutDashboard },
        { label: "Status Penanganan", href: "/petugas/status", icon: ClipboardList },
        { label: "Laporan Insiden", href: "/petugas/laporan-insiden", icon: FileText },
    ];

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <aside
            className={cn(
                "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
                collapsed ? "w-[68px]" : "w-60"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10">
                    <Shield className="h-5 w-5 text-teal" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">
                            Si SAKA
                        </span>
                        <span className="text-[10px] leading-tight text-muted-foreground">
                            Panel Petugas
                        </span>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 p-3">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                            title={item.label}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="border-t border-sidebar-border p-3">
                <div className="flex items-center justify-between px-1 pb-2">
                    {!collapsed && (
                        <span className="text-xs text-muted-foreground">Tema</span>
                    )}
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Keluar"
                >
                    <LogOut className={`h-5 w-5 shrink-0 ${isLoggingOut ? 'animate-pulse' : ''}`} />
                    {!collapsed && <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>}
                </button>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mt-2 flex w-full items-center justify-center rounded-xl py-2 text-muted-foreground transition-colors hover:bg-sidebar-accent/50"
                    aria-label={collapsed ? "Perlebar sidebar" : "Perkecil sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>
        </aside>
    );
}
