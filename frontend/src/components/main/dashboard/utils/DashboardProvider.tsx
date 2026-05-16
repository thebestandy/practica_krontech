import React, { createContext, useContext, useEffect, useState } from "react";

export interface ProjectData {
    id: string;
    name: string;
    searches: string[];
    graphData: {
        nodes: any[];
        links: any[];
    };
    sourceData?: Record<string, any[]>;
}

interface ProjectContextType {
    projects: ProjectData[];
    activeProjectId: string | null;
    activeProject: ProjectData | undefined;
    createProject: (name: string) => void;
    switchProject: (id: string) => void;
    updateProjectData: (updates: Partial<ProjectData>) => void;
    addSearch: (searchQuery: string) => void;
    // fuck it we ball
    isStorageFull: boolean;
    closePaywall: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "dashboard_projects_v5000000";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const [isStorageFull, setIsStorageFull] = useState(false);
    const [projects, setProjects] = useState<ProjectData[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("shits gettin serious ", e);
            }
        }
        return [
            {
                id: "project-1",
                name: "Project Alpha",
                searches: [],
                graphData: { nodes: [], links: [] },
                sourceData: {},
            },
            {
                id: "project-2",
                name: "Project Beta",
                searches: [],
                graphData: { nodes: [], links: [] },
                sourceData: {},
            },
        ];
    });

    const [activeProjectId, setActiveProjectId] = useState<string | null>(
        projects[0]?.id || null,
    );

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === "QuotaExceededError"
            ) {
                console.warn("the limit");
                setIsStorageFull(true);
            } else {
                console.error("yeah ts won't happen", error); // prolyl shoulda done catch typeerror like python but it's ok
            }
        }
    }, [projects]);

    const closePaywall = () => setIsStorageFull(false);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }, [projects]);

    const activeProject = projects.find((p) => p.id === activeProjectId);

    const createProject = (name: string) => {
        const newProject: ProjectData = {
            id: `proj-${Date.now()}`,
            name,
            searches: [],
            graphData: { nodes: [], links: [] },
        };
        setProjects((prev) => [...prev, newProject]);
        setActiveProjectId(newProject.id);
    };

    const switchProject = (id: string) => {
        setActiveProjectId(id);
    };

    const updateProjectData = (updates: Partial<ProjectData>) => {
        if (!activeProjectId) return;
        setProjects((prev) =>
            prev.map((proj) =>
                proj.id === activeProjectId ? { ...proj, ...updates } : proj,
            ),
        );
    };

    const addSearch = (searchQuery: string) => {
        if (!activeProjectId) return;
        setProjects((prev) =>
            prev.map((proj) =>
                proj.id === activeProjectId
                    ? { ...proj, searches: [...proj.searches, searchQuery] }
                    : proj,
            ),
        );
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                activeProjectId,
                activeProject,
                createProject,
                switchProject,
                updateProjectData,
                addSearch,
                isStorageFull,
                closePaywall,
            }}
        >
            {children}

            {isStorageFull && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-slate-900 border border-highlight/50 shadow-2xl p-6 rounded-lg text-center">
                        <h2 className="text-xl font-bold text-white mb-2">
                            Storage Limit Reached
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            You've mapped out a massive amount of data! To save
                            more projects and continue exploring, upgrade to a
                            Premium account.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={closePaywall}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                            >
                                Close
                            </button>
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition cursor-pointer">
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error("nigga");
    }
    return context;
}
