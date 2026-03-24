import { PanicButton } from "@/components/panic-button";
import { FileText, ShieldCheck, Lock, Phone } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

// Ensure settings changes reflect quickly on landing page
export const dynamic = "force-dynamic";

export default async function HomePage() {
    // Trik "flicker" selesai! Kita fetch langsung di server
    const settingsRows = await db.select().from(appSettings).limit(1);
    const settings = settingsRows[0] || null;

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center px-4 pb-16 pt-12 text-center sm:pb-24 sm:pt-20">
                {/* Soft gradient background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal/10 px-4 py-1.5 text-xs font-semibold text-teal sm:text-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Aman & Rahasia
                </div>

                <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                    {settings?.heroHeadline ? (
                        settings.heroHeadline
                    ) : (
                        <>Anda Tidak <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">Sendirian</span></>
                    )}
                </h1>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {settings?.heroSubheadline || "Laporkan kejadian kekerasan dengan aman. Identitas Anda dilindungi, bantuan segera dikirimkan."}
                </p>

                {/* Panic Button */}
                <div className="mt-10 sm:mt-14">
                    <PanicButton />
                </div>

                <p className="mt-6 text-xs text-muted-foreground/60">
                    Tekan tombol di atas untuk mengirim peringatan darurat secara anonim
                </p>
            </section>

            {/* Alternative: Form Report */}
            <section className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-background px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Atau Buat Laporan Lengkap
                        </h2>
                        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
                            Isi formulir pengaduan untuk melaporkan kejadian secara detail.
                            Tidak memerlukan registrasi.
                        </p>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Link
                            href="/laporan"
                            className="group flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/25"
                        >
                            <FileText className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                            Buat Laporan
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
                    {[
                        {
                            icon: Lock,
                            title: "Privasi Terjaga",
                            description:
                                "Data Anda dienkripsi dan disamarkan. Hanya petugas berwenang yang dapat mengakses identitas asli.",
                            color: "text-primary bg-primary/10",
                        },
                        {
                            icon: ShieldCheck,
                            title: "Tanpa Registrasi",
                            description:
                                "Akses darurat tanpa login. Kirim peringatan atau laporan kapan saja tanpa hambatan.",
                            color: "text-teal bg-teal/10",
                        },
                        {
                            icon: Phone,
                            title: "Respons Cepat",
                            description:
                                "Petugas langsung menerima notifikasi dan segera menindaklanjuti laporan Anda.",
                            color: "text-panic bg-panic/10",
                        },
                    ].map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                        >
                            <div
                                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}
                            >
                                <feature.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-card-foreground">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 px-4 py-8">
                <div className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()} {settings?.appName || "Si SAKA"} — {settings?.footerText || "Platform Layanan Perlindungan Masyarakat"}
                    </p>
                    <p className="mt-1">
                        Jika Anda dalam bahaya segera, hubungi{" "}
                        <strong className="text-foreground">{settings?.contactPhone || "110 / 119"}</strong>
                        <br />
                        Email Bantuan: <strong className="text-foreground">{settings?.contactEmail || "bantuan@sisaka.id"}</strong>
                    </p>
                </div>
            </footer>
        </div>
    );
}
