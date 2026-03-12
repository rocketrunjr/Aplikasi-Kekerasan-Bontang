import { OfficerSidebar } from "@/components/petugas/sidebar";

export default function PetugasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <OfficerSidebar />
            <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </div>
    );
}
