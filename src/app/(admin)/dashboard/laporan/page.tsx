"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ReportTable } from "@/components/admin/report-table";
import { Search, Filter, Printer, Download, Calendar, Plus, Loader2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useEffect } from "react";
import { Report } from "@/lib/types";

export default function LaporanListPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Delete state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<{ id: string, name: string } | null>(null);

    const handleDeleteClick = (id: string, name: string) => {
        setReportToDelete({ id, name });
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!reportToDelete) return;
        try {
            const res = await fetch(`/api/reports/${reportToDelete.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
            } else {
                console.error("Failed to delete report");
            }
        } catch (e) {
            console.error("Delete error", e);
        }
        setDeleteOpen(false);
        setReportToDelete(null);
    };

    useEffect(() => {
        fetch("/api/reports")
            .then(res => res.json())
            .then(data => {
                setReports(data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed fetching reports", err);
                setIsLoading(false);
            });
    }, []);

    const filtered = reports.filter((r) => {
        const matchesSearch =
            !search ||
            r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.maskedName.toLowerCase().includes(search.toLowerCase()) ||
            r.violenceCategory.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
        const matchesType = typeFilter === "ALL" || r.reportType === typeFilter;

        let matchesDate = true;
        if (dateFrom) {
            matchesDate = matchesDate && new Date(r.createdAt) >= new Date(dateFrom);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(r.createdAt) <= to;
        }

        return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedReports = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Nama (Masked)", "Kategori", "Status", "Tipe", "Tanggal"];
        const rows = filtered.map((r) => [
            r.id,
            r.maskedName,
            r.violenceCategory,
            r.status,
            r.reportType,
            new Date(r.createdAt).toLocaleDateString("id-ID"),
        ]);
        const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `laporan_sisaka_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        Daftar Laporan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {filtered.length} dari {reports.length} laporan tercatat
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="default"
                        className="gap-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        asChild
                    >
                        <Link href="/dashboard/laporan/buat">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Buat Laporan Baru</span>
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Cetak</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl"
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari ID, nama, atau kategori..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl pl-9"
                    />
                </div>
                <div className="flex gap-3">
                    <Select value={statusFilter} onValueChange={(val) => {
                        setStatusFilter(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-40 rounded-xl">
                            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="NEW">Baru</SelectItem>
                            <SelectItem value="RESPONDING">Ditanggapi</SelectItem>
                            <SelectItem value="CONTACTED">Dihubungi</SelectItem>
                            <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={(val) => {
                        setTypeFilter(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-40 rounded-xl">
                            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Tipe" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">Semua Tipe</SelectItem>
                            <SelectItem value="PANIC_BUTTON">Darurat</SelectItem>
                            <SelectItem value="FORM">Formulir</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1 shadow-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Filter Tanggal:</span>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                        Dari
                    </Label>
                    <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 w-40 rounded-xl text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                        Sampai
                    </Label>
                    <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 w-40 rounded-xl text-sm"
                    />
                </div>
                {(dateFrom || dateTo) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-xl text-xs text-muted-foreground"
                        onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                            setCurrentPage(1);
                        }}
                    >
                        Reset Tanggal
                    </Button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center p-12 bg-card rounded-2xl border border-border/50 text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> {` `} Memuat laporan...
                </div>
            ) : filtered.length > 0 ? (
                <div className="space-y-4">
                    <ReportTable
                        reports={paginatedReports}
                        onDelete={handleDeleteClick}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} hingga{" "}
                                {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} laporan
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg"
                                >
                                    Sebelumnya
                                </Button>
                                <div className="text-sm font-medium">
                                    Halaman {currentPage} dari {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg"
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card p-12 text-center shadow-sm">
                    <p className="text-muted-foreground">
                        Tidak ada laporan yang sesuai dengan filter.
                    </p>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <Trash2 className="h-6 w-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-center">
                            Hapus Laporan
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Apakah Anda yakin ingin menghapus laporan{" "}
                            <strong>{reportToDelete?.name || reportToDelete?.id}</strong> secara permanen?
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
