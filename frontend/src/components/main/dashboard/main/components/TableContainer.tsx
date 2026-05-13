import { useEffect, useState } from "react";
import { useWebSocket } from "../../utils/WebsocketProvider";
import Table from "./Table"; // Adjust import path as needed
import { cn } from "../../../../ui/lib/utils";

// shoulda imported it bu whatevs
interface GraphNode {
    id: string;
    type: string;
    label: string;
    summary?: string;
    url?: string;
    metadata?: string;
}

export default function TableContainer() {
    const { scans } = useWebSocket();

    const [sourceData, setSourceData] = useState<Record<string, GraphNode[]>>(
        {},
    );

    const [activeSource, setActiveSource] = useState<string | null>(null);

    // ts lowkennuinely so much better than the soup I had in table.tsx to whoeva is reading this

    useEffect(() => {
        setSourceData((prev) => {
            let newData = { ...prev };
            let hasChanges = false;

            Object.entries(scans).forEach(([_, updates]) => {
                updates.forEach((update: any) => {
                    if (
                        !update.data ||
                        !update.data.nodes ||
                        !update.data.source
                    )
                        return;

                    const sourceName = update.data.source;
                    const incomingNodes = update.data.nodes;

                    if (!newData[sourceName]) {
                        newData[sourceName] = [];
                        hasChanges = true;
                    }

                    const currentNodes = newData[sourceName];
                    const existingNodeIds = new Set(
                        currentNodes.map((n) => n.id),
                    );

                    const nodesToAdd = incomingNodes.filter(
                        (n: GraphNode) => !existingNodeIds.has(n.id),
                    );

                    if (nodesToAdd.length > 0) {
                        newData[sourceName] = [...currentNodes, ...nodesToAdd];
                        hasChanges = true;
                    }
                });
            });

            return hasChanges ? newData : prev;
        });
    }, [scans]);

    useEffect(() => {
        const sources = Object.keys(sourceData);
        if (!activeSource && sources.length > 0) {
            setActiveSource(sources[0]);
        }
    }, [sourceData, activeSource]);

    const sources = Object.keys(sourceData);

    return (
        <div className="flex h-full w-full overflow-hidden border border-highlight/30">
            <div className="w-64 shrink-0 border-r border-highlight/30 flex flex-col">
                <div className="p-4 border-b border-highlight/30">
                    <h2 className="text-sm font-semibold tracking-wider text-foreground">
                        Your Sources
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sources.length === 0 ? (
                        <p className="text-xs text-center text-foreground/30 italic p-2">
                            <Dots />
                        </p>
                    ) : (
                        sources.map((source) => (
                            <button
                                key={source}
                                onClick={() => setActiveSource(source)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-100 hover:cursor-pointer",
                                    activeSource === source
                                        ? "bg-highlight/10 text-foreground font-medium border border-highlight/30"
                                        : "text-foreground/20 border border-transparent",
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="truncate">{source}</span>
                                    <span className="text-xs bg-accent-foreground px-2 py-0.5 rounded-full text-foregound/20">
                                        {" "}
                                        {/* il schimbam in cerc daca e mai incolo */}
                                        {sourceData[source].length}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeSource ? (
                    <Table nodes={sourceData[activeSource]} />
                ) : (
                    <div className="h-full flex items-center justify-center text-foreground/40">
                        No sources yet.
                    </div>
                )}
            </div>
        </div>
    );
}

// shoulda put this in a dif file and made it way more eff but im lazy rn
function Dots() {
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount((prev) => (prev < 3 ? prev + 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <span className="w-100">
            <span className="font-medium text-muted-foreground">
                Waiting for data
                <span
                    className={cn(
                        "transition-all ease-in duration-100",
                        dotCount >= 1 ? "opacity-100" : "opacity-0",
                    )}
                >
                    .
                </span>
                <span
                    className={cn(
                        "transition-all ease-in duration-100",
                        dotCount >= 2 ? "opacity-100" : "opacity-0",
                    )}
                >
                    .
                </span>
                <span
                    className={cn(
                        "transition-all ease-in duration-100",
                        dotCount >= 3 ? "opacity-100" : "opacity-0",
                    )}
                >
                    .
                </span>
            </span>
        </span>
    );
}
