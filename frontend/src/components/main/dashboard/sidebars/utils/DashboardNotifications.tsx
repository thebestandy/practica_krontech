import { Bell } from "lucide-react";

interface DashboardEntry {
    title: string;
    summary: string;
    progress: number;
}

function Notifications({ data }: { data: DashboardEntry[] }) {
    return (
        <div className="flex h-full flex-col px-2 py-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notifications
                </h2>
                <Bell className="size-3 text-muted-foreground" />
            </div>
            <div className="flex-1 overflow-y-auto">
                {data.map((item, index) => (
                    <Notification key={index} item={item} />
                ))}
            </div>
        </div>
    );
}

function Notification({ item }: { item: DashboardEntry }) {
    return (
        <div
            className="my-3 relative rounded-xl border 
        border-secondary-foreground/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
        >
            <h3 className="mb-1 text-sm font-semibold text-foreground">
                {item.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {item.summary}
            </p>

            <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 w-full rounded-full bg-muted-foreground/20">
                    <div
                        className="h-full rounded-full transition-all bg-highlight"
                        style={{ width: `${item.progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                    {item.progress}%
                </span>
            </div>
        </div>
    );
}

export default Notifications;
