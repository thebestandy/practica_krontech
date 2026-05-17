import React, { useState, useEffect } from "react";

interface GraphTableProps {
    nodes: any[];
    onSendToGraph: (node: any) => void;
}

export default function GraphTable({ nodes, onSendToGraph }: GraphTableProps) {
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        node: any;
    } | null>(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    if (!nodes || nodes.length === 0) {
        return (
            <div className="w-full h-full border border-border bg-card/40 flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-xs rounded-md border-dashed">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 mb-3 text-border animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                Introduceți o țintă în căutare pentru a iniția scanarea bazei de
                date.
            </div>
        );
    }

    return (
        <div className="w-full h-full border border-border bg-card flex flex-col rounded-md shadow-md overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Rezultate identificat: {nodes.length}
                </span>
                <span className="text-[9px] text-highlight uppercase font-bold bg-highlight/10 px-2 py-0.5 rounded-sm">
                    Bază de date live
                </span>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-background z-10 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24">
                                Type
                            </th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Label
                            </th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Summary
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {nodes.map((row) => (
                            <tr
                                key={row.id}
                                className="transition-colors hover:bg-highlight/5 cursor-pointer"
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        node: row,
                                    });
                                }}
                            >
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                                            row.type === "Person"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : row.type === "Company"
                                                  ? "bg-amber-500/20 text-amber-400"
                                                  : row.type === "CourtCase"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-green-500/20 text-green-400"
                                        }`}
                                    >
                                        {row.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-bold text-foreground">
                                    {row.label}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                                    {row.summary || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Meniu tip right-click pentru trimitere în graf */}
            {contextMenu && (
                <div
                    className="fixed z-50 min-w-44 bg-card border border-border rounded-sm shadow-xl py-1 text-[10px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="w-full text-left px-4 py-2 font-bold uppercase text-highlight hover:bg-secondary transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSendToGraph(contextMenu.node);
                            setContextMenu(null);
                        }}
                    >
                        Send node to graph
                    </button>
                </div>
            )}
        </div>
    );
}
