import { SidebarLinks } from "./utils/SidebarLinks";
import Notifications from "./utils/DashboardNotifications";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../utils/ui/resizable";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../../ui/lib/utils";
import { useNavigate } from "react-router-dom";
import Settings from "../main/components/settings/Settings";
import { useProject } from "../utils/DashboardProvider";

export default function DashboardSidebar() {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { projects, activeProjectId, switchProject } = useProject();

    const links = [
        {
            title: "Projects",
            subprojects: projects.map((p) => ({
                id: p.id,
                label: p.name,
                onClick: () => switchProject(p.id),
                isActive: p.id === activeProjectId,
            })),
            // activeSubproject: activeProject?.name,
        },
        {
            title: "Settings",
            onClick: () => setIsSettingsOpen(!isSettingsOpen),
        },
        {
            title: "Logout",
            onClick: () => navigate("/logout"),
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
        <>
            <div className="flex h-screen w-full flex-col bg-background/95 p-7">
                <ResizablePanelGroup orientation="vertical">
                    <ResizablePanel
                        defaultSize="40%"
                        maxSize="60%"
                        minSize="10%"
                    >
                        <div
                            className="mb-6 flex items-center gap-2 px-2"
                            ref={containerRef}
                        >
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

                        <SidebarLinks data={links} />
                    </ResizablePanel>

                    <ResizableHandle className="bg-highlight/30" />

                    <ResizablePanel>
                        <div className="h-full overflow-hidden">
                            <Notifications data={notifications_data} />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            {isSettingsOpen && (
                <Settings onClose={() => setIsSettingsOpen(false)} />
            )}
        </>
    );
}
