import React, { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface GraphProps {
    graphData: { nodes: any[]; links: any[] };
    setGraphData: React.Dispatch<
        React.SetStateAction<{ nodes: any[]; links: any[] }>
    >;
}

export default function Graph({ graphData, setGraphData }: GraphProps) {
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 500, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Instrumente de desenare manuală (Codul prietenului tău recondiționat)
    const [contextMenu, setContextMenu] = useState<any>(null);
    const [connectingNode, setConnectingNode] = useState<any>(null);
    const [mousePos, setMousePos] = useState<any>(null);
    const fgRef = useRef<any>(null);

    const [pendingC, setPendingC] = useState<any>(null);
    const [label, setLabel] = useState("");

    const nodeTypes = [
        "Person",
        "Company",
        "CourtCase",
        "Document",
        "SocialProfile",
        "Media",
    ];
    const [pendingNode, setPendingNode] = useState<any>(null);
    const [newNodeForm, setNewNodeForm] = useState({
        type: "",
        name: "",
        description: "",
        link: "",
    });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }
    }, [graphData]);

    const handleMouseMove = (e: any) => {
        if (!connectingNode || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    let sourceScreenPos = null;
    if (connectingNode && fgRef.current) {
        sourceScreenPos = fgRef.current.graph2ScreenCoords(
            connectingNode.x,
            connectingNode.y,
        );
    }

    const finishC = () => {
        if (label.trim() && pendingC) {
            setGraphData((prev: any) => ({
                ...prev,
                links: [
                    ...prev.links,
                    {
                        source: pendingC.source.id,
                        target: pendingC.target.id,
                        label: label.trim(),
                    },
                ],
            }));
        }
        cancelConnection();
    };

    const cancelConnection = () => {
        setPendingC(null);
        setLabel("");
        setConnectingNode(null);
        setMousePos(null);
    };

    const finishNode = () => {
        if (newNodeForm.name.trim() && pendingNode && fgRef.current) {
            const graphCoords = fgRef.current.screen2GraphCoords(
                pendingNode.relX,
                pendingNode.relY,
            );
            const newNode = {
                id: `manual-node-${Date.now()}`,
                label: newNodeForm.name.trim(),
                summary: newNodeForm.description.trim(),
                link: "#",
                type: newNodeForm.type.trim() || "Person",
                x: graphCoords.x,
                y: graphCoords.y,
            };
            setGraphData((prev: any) => ({
                ...prev,
                nodes: [...prev.nodes, newNode],
            }));
        }
        setPendingNode(null);
    };

    const getNodeColor = (type: string) => {
        const colors: Record<string, string> = {
            Person: "#3b82f6",
            Company: "#f59e0b",
            CourtCase: "#ef4444",
            Document: "#10b981",
            SocialProfile: "#d946ef",
            Media: "#6366f1",
        };
        return colors[type] || "#9ca3af";
    };

    return (
        <div className="relative w-full h-full font-mono text-xs">
            <div
                className="w-full h-full cursor-pointer relative"
                ref={containerRef}
                onMouseMoveCapture={handleMouseMove}
            >
                <ForceGraph2D
                    width={dimensions.width}
                    ref={fgRef}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor={(node: any) => getNodeColor(node.type)}
                    nodeRelSize={6}
                    linkColor={() => "#cbd5e1"}
                    linkWidth={2}
                    onNodeClick={(node) => {
                        if (connectingNode) {
                            if (node.id !== connectingNode.id) {
                                setPendingC({
                                    source: connectingNode,
                                    target: node,
                                });
                                setLabel("");
                            } else cancelConnection();
                            setConnectingNode(null);
                            setMousePos(null);
                        } else setSelectedNode(node);
                    }}
                    onNodeRightClick={(node, event) => {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        setConnectingNode(null);
                        setMousePos(null);
                        setPendingC(null);
                        setContextMenu({
                            x: event.clientX,
                            y: event.clientY,
                            node: node,
                        });
                    }}
                    onBackgroundClick={() => {
                        setContextMenu(null);
                        if (connectingNode) {
                            setConnectingNode(null);
                            setMousePos(null);
                        }
                    }}
                    onBackgroundRightClick={(event) => {
                        event.preventDefault();
                        setConnectingNode(null);
                        setMousePos(null);
                        setPendingC(null);
                        setPendingNode(null);
                        if (!containerRef.current) return;
                        const rect =
                            containerRef.current.getBoundingClientRect();
                        setContextMenu({
                            x: event.clientX,
                            y: event.clientY,
                            relX: event.clientX - rect.left,
                            relY: event.clientY - rect.top,
                            type: "background",
                        });
                    }}
                    linkCanvasObjectMode={() => "after"}
                    linkCanvasObject={(link: any, ctx: any) => {
                        const start = link.source;
                        const end = link.target;
                        if (
                            typeof start !== "object" ||
                            typeof end !== "object"
                        )
                            return;
                        const textPos = {
                            x: start.x + (end.x - start.x) / 2,
                            y: start.y + (end.y - start.y) / 2,
                        };
                        ctx.font = `4px JetBrains Mono, monospace`;
                        ctx.fillStyle = "#94a3b8";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(link.label, textPos.x, textPos.y);
                    }}
                />

                {connectingNode && sourceScreenPos && mousePos && !pendingC && (
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 stroke-highlight text-highlight">
                        <line
                            x1={sourceScreenPos.x}
                            y1={sourceScreenPos.y}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                        />
                    </svg>
                )}

                {/* Pop-up Adăugare Legătură manuală */}
                {pendingC && (
                    <div className="absolute top-4 left-4 bg-card border border-border shadow-2xl p-4 z-20 w-64 rounded-sm">
                        <h3 className="text-foreground mb-2 font-bold uppercase tracking-widest text-[9px]">
                            Introduceți eticheta relației:
                        </h3>
                        <input
                            autoFocus
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") finishC();
                                if (e.key === "Escape") cancelConnection();
                            }}
                            className="w-full bg-background border border-border text-foreground text-xs px-3 py-2 mb-3 focus:outline-none focus:border-highlight rounded-sm"
                            placeholder="ex: COLABOREAZA_CU"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelConnection}
                                className="px-2 py-1 text-[9px] uppercase font-bold text-muted-foreground hover:text-foreground"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={finishC}
                                className="px-3 py-1 bg-highlight text-black font-bold uppercase text-[9px] rounded-sm"
                            >
                                Conectează
                            </button>
                        </div>
                    </div>
                )}

                {/* Pop-up Creare Nod manual pe fundal */}
                {pendingNode && (
                    <div className="absolute top-4 left-4 bg-card border border-border shadow-2xl p-4 z-20 w-64 rounded-sm">
                        <h3 className="text-foreground mb-3 font-bold uppercase tracking-widest text-[9px]">
                            Adăugare Nod Nou:
                        </h3>
                        <div className="flex flex-col gap-2 mb-3">
                            <select
                                autoFocus
                                value={newNodeForm.type}
                                onChange={(e) =>
                                    setNewNodeForm({
                                        ...newNodeForm,
                                        type: e.target.value,
                                    })
                                }
                                className="w-full bg-background border border-border text-foreground text-xs px-2 py-1.5 focus:outline-none focus:border-highlight rounded-sm"
                            >
                                <option value="" disabled>
                                    Selectați tipul...
                                </option>
                                {nodeTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newNodeForm.name}
                                onChange={(e) =>
                                    setNewNodeForm({
                                        ...newNodeForm,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full bg-background border border-border text-foreground text-xs px-2 py-1.5 focus:outline-none focus:border-highlight rounded-sm"
                                placeholder="Nume Entitate"
                            />
                            <input
                                type="text"
                                value={newNodeForm.description}
                                onChange={(e) =>
                                    setNewNodeForm({
                                        ...newNodeForm,
                                        description: e.target.value,
                                    })
                                }
                                className="w-full bg-background border border-border text-foreground text-xs px-2 py-1.5 focus:outline-none focus:border-highlight rounded-sm"
                                placeholder="Scurtă Descriere"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setPendingNode(null)}
                                className="px-2 py-1 text-[9px] uppercase font-bold text-muted-foreground hover:text-foreground"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={finishNode}
                                className="px-3 py-1 bg-highlight text-black font-bold uppercase text-[9px] rounded-sm"
                            >
                                Creează
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Context menu din click dreapta */}
            {contextMenu && (
                <div
                    className="fixed z-50 min-w-40 bg-card border border-border rounded-sm shadow-xl py-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {contextMenu.type === "background" ? (
                        <button
                            className="w-full text-left px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-foreground hover:bg-secondary transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPendingNode({
                                    relX: contextMenu.relX,
                                    relY: contextMenu.relY,
                                });
                                setNewNodeForm({
                                    type: "",
                                    name: "",
                                    link: "",
                                    description: "",
                                });
                                setContextMenu(null);
                            }}
                        >
                            Adaugă Nod
                        </button>
                    ) : (
                        <button
                            className="w-full text-left px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-foreground hover:bg-secondary transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConnectingNode(contextMenu.node);
                                setContextMenu(null);
                            }}
                        >
                            Creează Legătură
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
