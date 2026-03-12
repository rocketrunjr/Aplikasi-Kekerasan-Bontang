import { CheckCircle, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";

export default function SuksesPage() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-teal/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-teal/10">
                    <CheckCircle className="h-10 w-10 text-teal" />
                </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Laporan Berhasil Dikirim
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
                Terima kasih atas keberanian Anda. Tim kami akan segera meninjau laporan
                dan menindaklanjuti secepat mungkin.
            </p>

            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Heart className="h-4 w-4" />
                    Anda Tidak Sendirian
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Nama Anda telah disamarkan secara otomatis
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Petugas akan menghubungi Anda jika kontak diberikan
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Jika situasi darurat, tekan Tombol Panik di beranda
                    </li>
                </ul>
            </div>

            <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
            </Link>
        </div>
    );
}
