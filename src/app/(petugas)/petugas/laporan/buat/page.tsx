export default function PetugasBuatLaporanPage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto py-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Tambah Laporan Baru
            </h1>
            <p className="text-muted-foreground text-sm">
                Formulir input tindakan proaktif atau laporan yang diterima langsung di lapangan oleh Petugas.
            </p>

            <div className="mt-8">
                <ManualReportFormWrapper />
            </div>
        </div>
    );
}

import { ManualReportForm } from "@/components/manual-report-form";
function ManualReportFormWrapper() {
    // Return back to petugas dashboard after submitting
    return <ManualReportForm backUrl="/petugas" />;
}
