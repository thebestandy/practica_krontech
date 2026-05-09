import { Search, Download, ExpandIcon, Settings } from "lucide-react";
import { SidebarLinks } from "./utils/SidebarLinks";
import Notifications from "./utils/DashboardNotifications";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../utils/ui/resizable";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../../ui/lib/utils";

export default function DashboardSidebar() {
    const data = [
        {
            title: "Search",
            link: "/search",
            icon: Search,
        },
        {
            title: "jobs",
            link: "/jobs",
            icon: ExpandIcon,
        },
        {
            title: "Chat to agent",
            link: "/agent",
            icon: Download,
        },
        {
            title: "export data",
            link: "/export",
            icon: Download,
        },
        {
            title: "settings",
            link: "/settings",
            icon: Settings,
        },
    ];

    const notifications_data = [
        {
            title: "Search",
            summary: "/search",
            progress: 50,
        },
        {
            title: "Search",
            summary: "/search",
            progress: 50,
        },
        {
            title: "Search",
            summary: "/search",
            progress: 50,
        },
        {
            title: "Search",
            summary: "/search",
            progress: 50,
        },
    ];

    const [isCompact, setIsCompact] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setIsCompact(entry.contentRect.width < 100);
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="flex h-screen w-full flex-col bg-background/95 p-7">
            <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize="40%" maxSize="60%" minSize="10%">
                    <div
                        className="mb-6 flex items-center gap-2 px-2"
                        ref={containerRef}
                    >
                        <div
                            className={cn(
                                isCompact
                                    ? "ml-2"
                                    : "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
                            )}
                        >
                            logo
                        </div>
                        <span
                            className={cn(
                                isCompact
                                    ? "hidden"
                                    : "font-semibold tracking-tight",
                            )}
                        >
                            Workspace
                        </span>
                    </div>

                    <SidebarLinks data={data} />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel>
                    <div className="h-full overflow-hidden">
                        <Notifications data={notifications_data} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
