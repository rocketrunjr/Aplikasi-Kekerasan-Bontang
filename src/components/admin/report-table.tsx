import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { Report } from "@/lib/types";

const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    NEW: { label: "Baru", variant: "destructive" },
    RESPONDING: { label: "Ditanggapi", variant: "default" },
    CONTACTED: { label: "Proses", variant: "secondary" },
    ARCHIVED: { label: "Selesai", variant: "outline" },
};

const typeConfig: Record<string, { label: string; className: string }> = {
    PANIC_BUTTON: {
        label: "Darurat",
        className: "bg-panic/10 text-panic border-panic/20",
    },
    FORM: {
        label: "Formulir",
        className: "bg-primary/10 text-primary border-primary/20",
    },
};

interface ReportTableProps {
    reports: Report[];
    onDelete?: (id: string, name: string) => void;
    startIndex?: number;
}

export function ReportTable({ reports, onDelete, startIndex = 1 }: ReportTableProps) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">No</TableHead>
                        <TableHead className="w-28">ID</TableHead>
                        <TableHead>Nama Korban</TableHead>
                        <TableHead className="w-28">Tipe</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-40">Tanggal</TableHead>
                        <TableHead className="w-20 text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report, index) => {
                        const status = statusConfig[report.status];
                        const type = typeConfig[report.reportType];
                        return (
                            <TableRow key={report.id} className="group">
                                <TableCell className="text-sm text-muted-foreground">
                                    {startIndex + index}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {report.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {report.maskedName}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${type.className}`}
                                    >
                                        {type.label}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {report.violenceCategory}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={status.variant} className="rounded-lg">
                                        {status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(report.createdAt).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                        <Link href={`/dashboard/laporan/${report.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-lg p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => onDelete(report.id, report.maskedName)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
