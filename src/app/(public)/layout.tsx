import { Navbar } from "@/components/navbar";
import { QuickExitButton } from "@/components/quick-exit-button";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <QuickExitButton />
            <Navbar />
            <main>{children}</main>
        </div>
    );
}
