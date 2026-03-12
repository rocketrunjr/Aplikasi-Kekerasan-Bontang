export default function AdminBuatLaporanPage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Tambah Laporan Baru
            </h1>
            <p className="text-muted-foreground text-sm">
                Tambahkan data pelaporan pengaduan kekerasan yang diterima secara luring (offline) oleh Satgas Si SAKA.
            </p>

            {/* The manual form component will be hydrated client-side */}
            <div className="mt-8">
                {/* We dynamically import to avoid SSR mismatches if needed, but the form uses "use client" so we can just use it directly */}
                <ManualReportFormWrapper />
            </div>
        </div>
    );
}

// Separate component for clarity
import { ManualReportForm } from "@/components/manual-report-form";
function ManualReportFormWrapper() {
    return <ManualReportForm backUrl="/dashboard/laporan" />;
}
