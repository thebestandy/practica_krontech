import { useEffect, useState } from "react";
import { useWebSocket } from "../../utils/WebsocketProvider";
import { ExternalLink } from "lucide-react";
import { cn } from "../../../../ui/lib/utils";
import Datasheet from "./utils/Datasheet";
import { useGraphSelection } from "./utils/NodeProvider";

export interface GraphNode {
    id: string;
    type: string;
    label: string;
    summary?: string;
    url?: string;
    metadata?: string;
    batchId?: string;
}

interface TableProps {
    nodes: GraphNode[];
}

export default function Table({ nodes = [] }: TableProps) {
    const [selectedRow, setSelectedRow] = useState<GraphNode | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        node: GraphNode;
    } | null>(null);

    const { sendNodeToGraph } = useGraphSelection();

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, []);

    const handleSendToGraph = (node: GraphNode) => {
        console.log("Sending node to graph: ", node);
        sendNodeToGraph(node);
        setContextMenu(null);
    };

    const [activeBatch, setActiveBatch] = useState<string | null>(null);

    const batches = Array.from(
        new Set(nodes.map((n) => n.batchId).filter(Boolean)),
    ) as string[];

    const filteredNodes = activeBatch
        ? nodes.filter((n) => n.batchId === activeBatch)
        : nodes;

    const getTypeStyles = (type: string) => {
        const styles: Record<string, string> = {
            Person: "text-blue-600 bg-blue-50 border-blue-200",
            Company: "text-amber-600 bg-amber-50 border-amber-200",
            CourtCase: "text-red-600 bg-red-50 border-red-200",
            Document: "text-emerald-600 bg-emerald-50 border-emerald-200",
            SocialProfile: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200",
            Media: "text-indigo-600 bg-indigo-50 border-indigo-200",
        };
        return styles[type] || "text-slate-600 bg-slate-50 border-slate-200";
    };

    const renderTableRows = () => {
        const rows: React.ReactNode[] = [];
        let currentBatchId: string | undefined | null = undefined;

        filteredNodes.forEach((node) => {
            if (!activeBatch && node.batchId !== currentBatchId) {
                rows.push(
                    <tr
                        key={`separator-${node.batchId}`}
                        className="bg-highlight/5 border-y border-highlight/30"
                    >
                        <td
                            colSpan={4}
                            className="px-4 py-2 text-xs font-semibold tracking-wider text-foreground/60 uppercase"
                        >
                            {node.batchId || "Initial Data"}
                        </td>
                    </tr>,
                );
                currentBatchId = node.batchId;
            }

            rows.push(
                <tr
                    key={node.id}
                    className="group transition-all hover:cursor-pointer duration-150 ease-in-out hover:bg-highlight/10"
                    onClick={() => setSelectedRow(node)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, node });
                    }}
                >
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                                getTypeStyles(node.type),
                            )}
                        >
                            {node.type}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {node.label}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80 leading-relaxed max-w-md">
                        <p className="line-clamp-2">{node.summary || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                        {node.url && node.url !== "N/A" ? (
                            <a
                                href={node.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-highlight/50 hover:text-highlight transition-all duration-100"
                            >
                                Source <ExternalLink size={12} />
                            </a>
                        ) : (
                            <span className="text-foreground/30">-</span>
                        )}
                    </td>
                </tr>,
            );
        });

        return rows;
    };

    return (
        <>
            <div className="h-full w-full overflow-hidden flex">
                <div className="flex-1 overflow-auto flex flex-col">
                    <table className="w-full text-left border-b border-highlight/30">
                        <thead className="sticky top-0 z-10 backdrop-blur-md bg-background/80">
                            <tr className="border-b border-highlight/30">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                                    Label
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                                    Summary
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                                    Link
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-highlight/30">
                            {nodes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-12 text-center text-sm italic"
                                    >
                                        <Dots />
                                    </td>
                                </tr>
                            ) : (
                                renderTableRows()
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ts so ass but its ok */}
                {batches.length > 0 && (
                    <div className="w-64 shrink-0 border-l border-highlight/30 flex flex-col bg-background/50">
                        <div className="p-4 border-b border-highlight/30 flex justify-between items-center">
                            <h2 className="text-sm font-semibold tracking-wider text-foreground">
                                Seach by Targets
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {batches.map((batch) => (
                                <button
                                    key={batch}
                                    onClick={() =>
                                        setActiveBatch(
                                            batch === activeBatch
                                                ? null
                                                : batch,
                                        )
                                    }
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-100 hover:cursor-pointer flex justify-between items-center",
                                        activeBatch === batch
                                            ? "bg-highlight/10 text-foreground font-medium border border-highlight/30"
                                            : "text-foreground/50 hover:bg-highlight/10 border border-transparent",
                                    )}
                                >
                                    <span className="truncate">{batch}</span>
                                    <span className="text-xs bg-accent-foreground px-2 py-0.5 rounded-full text-foreground/30">
                                        {
                                            nodes.filter(
                                                (n) => n.batchId === batch,
                                            ).length
                                        }
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {contextMenu && (
                <div
                    className="fixed z-50 min-w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="w-full text-left px-5 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors hover:cursor-crosshair"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSendToGraph(contextMenu.node);
                        }}
                    >
                        Send node to graph
                    </button>
                </div>
            )}

            {selectedRow && (
                <Datasheet
                    data={selectedRow}
                    isOpen={selectedRow !== null}
                    onClose={() => setSelectedRow(null)}
                />
            )}
        </>
    );
}

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
                No data
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
