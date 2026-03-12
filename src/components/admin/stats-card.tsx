import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
}: StatsCardProps) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-card-foreground">
                        {value}
                    </p>
                </div>
                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        bgColor
                    )}
                >
                    <Icon className={cn("h-6 w-6", color)} />
                </div>
            </div>
        </div>
    );
}
