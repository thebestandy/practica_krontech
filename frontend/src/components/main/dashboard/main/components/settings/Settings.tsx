import { Plus, X, Palette, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useProject } from "../../../utils/DashboardProvider";
import { cn } from "../../../../../ui/lib/utils";
import { useTheme } from "../../../../../theme-provider";

export default function Settings({ onClose }: { onClose: () => void }) {
    const { createProject, projects, activeProjectId, switchProject } =
        useProject();
    const [newProjectName, setNewProjectName] = useState("");
    const { theme, setTheme } = useTheme();

    const themes = ["yellow", "purple", "turquoise"];

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
        // Optional: Keep modal open after creating, or close it.
        // onClose();
    };

    const cycleTheme = () => {
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md transition-all animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="
                    relative w-full max-w-lg
                    rounded-2xl
                    border border-highlight/20
                    bg-background/95
                    p-8
                    shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]
                    animate-in zoom-in-95 duration-200
                "
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-medium tracking-tight text-foreground">
                        Settings
                    </h2>

                    <button
                        onClick={onClose}
                        className="
                            rounded-full p-2
                            text-foreground/40
                            transition-colors duration-200
                            hover:bg-highlight/10
                            hover:text-highlight
                            hover:cursor-pointer
                        "
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                    {/* Projects Row */}
                    <div className="flex flex-col gap-3 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                            Active Projects
                        </span>

                        <div className="flex flex-wrap gap-2">
                            {projects.map((proj) => {
                                const active = activeProjectId === proj.id;

                                return (
                                    <button
                                        key={proj.id}
                                        onClick={() => switchProject(proj.id)}
                                        className={cn(
                                            `
                                                rounded-md
                                                border
                                                px-3 py-1.5
                                                text-sm font-medium
                                                transition-all duration-200
                                                hover:cursor-pointer
                                            `,
                                            active
                                                ? `
                                                    border-highlight/30
                                                    bg-highlight/15
                                                    text-highlight
                                                    shadow-sm
                                                `
                                                : `
                                                    border-highlight/10
                                                    bg-transparent
                                                    text-foreground/60
                                                    hover:border-highlight/30
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

                    {/* New Project Row */}
                    <div className="flex items-center justify-between py-4 border-t border-highlight/10">
                        <span className="text-sm font-medium text-foreground/80">
                            Create New
                        </span>

                        <form
                            onSubmit={handleCreateProject}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) =>
                                    setNewProjectName(e.target.value)
                                }
                                placeholder="Project name..."
                                className="
                                    w-40
                                    rounded-md
                                    border border-highlight/20
                                    bg-background/50
                                    px-3 py-1.5
                                    text-sm text-foreground
                                    placeholder:text-foreground/30
                                    outline-none
                                    transition-all duration-200
                                    focus:border-highlight/60
                                    focus:bg-highlight/5
                                "
                            />

                            <button
                                type="submit"
                                disabled={!newProjectName.trim()}
                                className="
                                    flex items-center justify-center
                                    rounded-md
                                    bg-highlight
                                    px-3 py-1.5
                                    text-sm font-medium text-background
                                    transition-all duration-200
                                    hover:opacity-90
                                    hover:cursor-pointer
                                    disabled:opacity-30 disabled:hover:cursor-not-allowed
                                "
                            >
                                <Plus className="h-4 w-4 mr-1 -ml-1" />
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Theme Row */}
                    <div className="flex items-center justify-between py-4 border-t border-highlight/10">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-foreground/50" />
                            <span className="text-sm font-medium text-foreground/80">
                                Appearance
                            </span>
                        </div>

                        {/* Note: In your original code you passed () => cycleTheme instead of cycleTheme. Fixed here. */}
                        <ThemeCycleButton
                            onClick={cycleTheme}
                            currentTheme={theme}
                        />
                    </div>

                    {/* Logout Row */}
                    <div className="flex justify-end pt-6 mt-2 border-t border-highlight/10">
                        <button
                            className="
                                flex items-center gap-2
                                rounded-md px-3 py-2
                                text-sm font-medium
                                text-foreground/50
                                transition-colors duration-200
                                hover:bg-red-500/10 hover:text-red-500
                                hover:cursor-pointer
                            "
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ThemeCycleButton = ({
    onClick,
    currentTheme,
}: {
    onClick: () => void;
    currentTheme: string;
}) => {
    const themeIcons: Record<string, string> = {
        yellow: "Yellow",
        purple: "Purple",
        turquoise: "Turquoise",
    };

    return (
        <button
            onClick={onClick}
            className="
                group relative flex items-center gap-2
                rounded-md border border-highlight/20
                bg-background/50 px-3 py-1.5
                text-sm font-medium text-foreground/80
                transition-all duration-200
                hover:border-highlight/40 hover:bg-highlight/10 hover:text-highlight
                hover:cursor-pointer
            "
        >
            {/* Added a dynamic indicator dot that can grab the global highlight color */}
            <span className="h-2.5 w-2.5 rounded-full bg-highlight transition-colors duration-300"></span>
            <span className="capitalize">
                {themeIcons[currentTheme] ?? currentTheme}
            </span>
        </button>
    );
};
