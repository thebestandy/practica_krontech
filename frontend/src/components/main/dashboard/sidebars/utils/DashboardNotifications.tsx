import { Bell } from "lucide-react";
import { useWebSocket } from "../../utils/WebsocketProvider";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "../../../../ui/lib/utils";
import { useEffect, useState } from "react";

interface DashboardEntry {
    title: string;
    summary: string;
    progress: number;
}

function Notifications({ data }: { data: DashboardEntry[] }) {
    const { scans, connectionStatus } = useWebSocket();

    const scanEntries = Object.entries(scans);

    return (
        <div className="flex h-full flex-col px-2 py-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
                <div className="flex gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Notifications
                    </h2>
                    <Tooltip.Provider delayDuration={200}>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button
                                    className="relative flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 mt-[-3px]
                                focus:outline-none dark:hover:bg-slate-800 transition-colors"
                                >
                                    <span
                                        className={cn(
                                            "absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-75",
                                            connectionStatus === "disconnected"
                                                ? "bg-red-400"
                                                : "bg-green-400",
                                        )}
                                    ></span>
                                    <span
                                        className={cn(
                                            "relative inline-flex h-2 w-2 rounded-full",
                                            connectionStatus === "disconnected"
                                                ? "bg-red-500"
                                                : "bg-green-500",
                                        )}
                                    ></span>
                                </button>
                            </Tooltip.Trigger>

                            <Tooltip.Portal>
                                <Tooltip.Content
                                    sideOffset={6}
                                    className="z-50 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 dark:border-slate-800 dark:bg-slate-950"
                                >
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <span className="font-medium">
                                            Connection:
                                        </span>
                                        <span
                                            className={cn(
                                                "font-semibold",
                                                connectionStatus ===
                                                    "disconnected"
                                                    ? "dark:text-red-600 text-red-400"
                                                    : "text-green-600 dark:text-green-400",
                                            )}
                                        >
                                            {connectionStatus === "disconnected"
                                                ? "Offline"
                                                : "Online"}
                                        </span>
                                    </div>
                                    <Tooltip.Arrow className="fill-white dark:fill-slate-950" />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                </div>
                <Bell className="size-3 text-muted-foreground" />
            </div>
            {scanEntries.length === 0 ? (
                <div className="w-full h-full grid place-items-center text-xs text-zinc-400 text-center">
                    {connectionStatus === "disconnected"
                        ? "Systems not online. Contact developers"
                        : "No workers yet"}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {scanEntries.map(([scanId, thing]) => {
                        const latestUpdate = thing[thing.length - 1];

                        if (!latestUpdate) return null;

                        return (
                            <Notification
                                key={scanId}
                                targetName={latestUpdate.target}
                                progress={latestUpdate.progress}
                                latestMessage={latestUpdate.message}
                                type={latestUpdate.type}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Notification({
    targetName,
    progress,
    latestMessage,
    type,
}: {
    targetName: string;
    progress?: number;
    latestMessage: string;
    type?: string;
}) {
    console.log(progress);
    console.log(targetName);

    const [realP, setProgress] = useState(progress ?? 0);
    const [err, setErr] = useState(type !== "ERROR" ? "ok" : "err");

    useEffect(() => {
        if (type === "ERROR") {
            console.warn("ts frying yo ahh");
            setErr("err");
            setProgress(100);
        } else {
            if (progress !== undefined) {
                setProgress(progress);
            }
            setProgress((prev) => Math.min(prev + 1, 100));
        }
    }, [progress, latestMessage]);

    return (
        <div
            className="my-3 relative rounded-xl border 
        border-secondary-foreground/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
        >
            <h3 className="mb-1 text-sm font-semibold text-foreground">
                {targetName}
            </h3>
            <p
                className={cn(
                    "text-xs text-muted-foreground leading-relaxed",
                    err === "err" ? "text-red-500" : "",
                )}
            >
                {latestMessage ? latestMessage : <Dots />}
                {err === "err"
                    ? "\nContact the developer or your scraper isn't properly integrated."
                    : ""}
            </p>

            <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 w-full rounded-full bg-muted-foreground/20">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500 ease-out",

                            err === "err"
                                ? "text-red-500 bg-red-500"
                                : "bg-highlight",
                        )}
                        style={{ width: `${realP}%` }}
                    />
                </div>
                <span
                    className={cn(
                        "text-[10px] font-medium text-muted-foreground",
                        err === "err"
                            ? "text-red-500"
                            : "text-muted-foreground",
                    )}
                >
                    {realP}%
                </span>
            </div>
        </div>
    );
}

function Dots() {
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
        }, 200);

        return () => clearInterval(interval);
    }, []);

    return (
        <span className="font-medium text-muted-foreground">
            Working{".".repeat(dotCount)}
        </span>
    );
}

export default Notifications;
