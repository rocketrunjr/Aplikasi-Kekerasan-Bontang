import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-x-hidden">
                <div className="mx-auto max-w-6xl p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
