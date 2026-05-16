import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useProject } from "../../../utils/DashboardProvider";
import { cn } from "../../../../../ui/lib/utils";

export default function Settings({ onClose }: { onClose: () => void }) {
    const { createProject, projects, activeProjectId, switchProject } =
        useProject();
    const [newProjectName, setNewProjectName] = useState("");

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        createProject(newProjectName.trim());
        setNewProjectName("");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="
            relative w-full max-w-xl
            rounded-3xl
            border border-highlight/20
            bg-background/95
            px-7 py-6
            shadow-2xl shadow-black/40
        "
            >
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-[22px] font-light tracking-tight text-foreground">
                        Settings
                    </h2>

                    <button
                        onClick={onClose}
                        className="
                    rounded-full p-1.5
                    text-foreground/30
                    transition-all duration-150
                    hover:bg-highlight/10
                    hover:text-highlight
                    hover:cursor-pointer
                "
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="divide-y divide-highlight/10">
                    <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-light text-foreground/80">
                            Projects
                        </span>

                        <div className="flex flex-wrap justify-end gap-2 max-w-[60%]">
                            {projects.map((proj) => {
                                const active = activeProjectId === proj.id;

                                return (
                                    <button
                                        key={proj.id}
                                        onClick={() => switchProject(proj.id)}
                                        className={cn(
                                            `
                                    rounded-full
                                    border
                                    px-3 py-1
                                    text-xs
                                    transition-all duration-150
                                    hover:cursor-pointer
                                `,
                                            active
                                                ? `
                                            border-highlight/40
                                            bg-highlight/10
                                            text-highlight
                                            shadow-[0_0_12px_rgba(120,119,198,0.15)]
                                        `
                                                : `
                                            border-transparent
                                            text-foreground/40
                                            hover:border-highlight/20
                                            hover:bg-highlight/5
                                            hover:text-foreground
                                        `,
                                        )}
                                    >
                                        {proj.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-light text-foreground/80">
                            New
                        </span>

                        <form
                            onSubmit={handleCreateProject}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) =>
                                    setNewProjectName(e.target.value)
                                }
                                placeholder="project"
                                className="
                            w-32
                            border-0 border-b border-highlight/20
                            bg-transparent
                            px-1 py-1.5
                            text-sm text-foreground
                            placeholder:text-foreground/20
                            outline-none
                            transition-all duration-150
                            focus:border-highlight/50
                        "
                            />

                            <button
                                type="submit"
                                disabled={!newProjectName.trim()}
                                className="
                            rounded-full
                            border border-highlight/20
                            px-3 py-1
                            text-xs text-foreground/70
                            transition-all duration-150
                            hover:border-highlight/40
                            hover:bg-highlight/10
                            hover:text-highlight
                            hover:cursor-pointer
                            disabled:opacity-30
                        "
                            >
                                Create
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-end py-4">
                        <button
                            className="
                        text-sm font-light
                        text-foreground/40
                        transition-all duration-150
                        hover:text-highlight
                    "
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
