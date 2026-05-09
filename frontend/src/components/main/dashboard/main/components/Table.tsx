import { useEffect, useState } from "react";
import { useWebSocket } from "../../utils/WebsocketProvider";
import { ExternalLink } from "lucide-react";
import { cn } from "../../../../ui/lib/utils";

interface GraphNode {
    id: string;
    type: string;
    label: string;
    summary?: string;
    url?: string;
}

export default function Table() {
    const { scans } = useWebSocket();
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const scanEntries = Object.entries(scans);

    useEffect(() => {
        setNodes((prev) => {
            console.log("update works");
            let currentNodes = [...prev];
            let hasChanges = false;

            scanEntries.forEach(([_, updates]) => {
                updates.forEach((update) => {
                    if (!update.data || !update.data.nodes) return;

                    const existingNodeIds = new Set(
                        currentNodes.map((n) => n.id),
                    );
                    const nodesToAdd = update.data.nodes.filter(
                        (n: GraphNode) => !existingNodeIds.has(n.id),
                    );

                    if (nodesToAdd.length > 0) {
                        currentNodes = [...currentNodes, ...nodesToAdd];
                        hasChanges = true;
                    }
                });
            });

            return hasChanges ? currentNodes : prev;
        });
    }, [scans]);

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

    return (
        <div className="h-full w-full overflow-hidden flex flex-col border">
            <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 backdrop-blur-md dark:bg-slate-900/90">
                        <tr className="border-b border-slate-800">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Type
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Label
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Summary
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Link
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                        {nodes.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-12 text-center text-sm text-slate-400 italic"
                                >
                                    no nodes
                                </td>
                            </tr>
                        ) : (
                            nodes.map((node) => (
                                <tr
                                    key={node.id}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
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
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                                        {node.label}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400 leading-relaxed max-w-md">
                                        <p className="line-clamp-2">
                                            {node.summary || "-"}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {node.url && node.url !== "N/A" ? (
                                            <a
                                                href={node.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-all"
                                            >
                                                Source{" "}
                                                <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-slate-700">
                                                -
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
