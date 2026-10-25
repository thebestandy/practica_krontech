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
import { X } from "lucide-react";
import { useNotes } from "../utils/NotesProvider";

export default function DashboardSidebar() {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const { projects, activeProjectId, switchProject } = useProject();
    const { notes, activeNoteId, switchNote, createNote } = useNotes();

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
            title: "Notes",
            subprojects: [
                ...notes.map((n) => ({
                    id: n.id,
                    label: n.title || "Untitled",
                    onClick: () => {
                        switchNote(n.id);
                        setIsNotesOpen(true);
                    },
                    isActive: n.id === activeNoteId,
                })),
                {
                    id: "new-note",
                    label: "+ New Note",
                    onClick: () => {
                        createNote();
                        setIsNotesOpen(true);
                    },
                    isActive: false,
                },
            ],
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
            {isNotesOpen && (
                <NotesModal onClose={() => setIsNotesOpen(false)} />
            )}
        </>
    );
}

function NotesModal({ onClose }: { onClose: () => void }) {
    const { activeNote, updateNote, deleteNote } = useNotes();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!activeNote) {
        onClose();
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center bg-background/80 p-8 md:p-16 transition-all animate-in fade-in duration-200 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="flex h-full w-full max-w-4xl flex-col animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-8 flex items-center justify-between border-b border-highlight/10 pb-4">
                    <input
                        type="text"
                        value={activeNote.title}
                        onChange={(e) =>
                            updateNote(activeNote.id, { title: e.target.value })
                        }
                        placeholder="Note Title..."
                        className="bg-transparent text-2xl font-light text-foreground/80 focus:outline-none w-full mr-4 placeholder:text-foreground/20"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-foreground/40 transition-colors duration-200 hover:bg-highlight/10 hover:text-highlight hover:cursor-pointer"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <textarea
                    autoFocus
                    value={activeNote.content}
                    onChange={(e) =>
                        updateNote(activeNote.id, { content: e.target.value })
                    }
                    placeholder="Jot down some thoughts..."
                    className="
                        h-full w-full resize-none bg-transparent 
                        text-lg font-light leading-relaxed text-foreground
                        placeholder:text-foreground/20 
                        focus:outline-none focus:ring-0
                    "
                    spellCheck={false}
                />
                <div className="w-full h-50 grid place-items-center">
                    <button
                        onClick={() => {
                            deleteNote(activeNote.id);
                            onClose();
                        }}
                        className="text-sm text-highlight hover:text-highlight/50 duration-75 ease-in px-3 transition-colors hover:cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
