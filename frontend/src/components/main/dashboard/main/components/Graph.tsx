import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import mockData from "./mock_data.json";
import Datasheet from "./utils/Datasheet";
import { useWebSocket } from "../../utils/WebsocketProvider";
import { useGraphSelection } from "./utils/NodeProvider";
import { useProject } from "../../utils/DashboardProvider";

export default function Graph() {
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef(null);

    const { scans } = useWebSocket();

    const { activeProject, updateProjectData } = useProject();
    const [graphData, setGraphData] = useState(
        activeProject?.graphData || { nodes: [], links: [] },
    );
    const nodes = graphData["nodes"];
    const edges = graphData["links"];

    const scanEntries = Object.entries(scans);

    const { incomingNode } = useGraphSelection();

    useEffect(() => {
        if (activeProject) {
            setGraphData(activeProject.graphData);
        }
    }, [activeProject?.id]);

    useEffect(() => {
        updateProjectData({ graphData });
    }, [graphData]);

    // kinda getting crowded over here
    const [contextMenu, setContextMenu] = useState(null);
    const [connectingNode, setConnectingNode] = useState(null);
    const [mousePos, setMousePos] = useState(null);
    const fgRef = useRef(null);

    const [pendingC, setPendingC] = useState(null);
    const [label, setLabel] = useState("");

    // too crowded
    const nodeTypes = [
        "Person",
        "Company",
        "CourtCase",
        "Document",
        "SocialProfile",
        "Media",
    ];

    const handleMouseMove = (e) => {
        if (!connectingNode || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    let sourceScreenPos = null;
    if (connectingNode && fgRef.current) {
        sourceScreenPos = fgRef.current.graph2ScreenCoords(
            connectingNode.x,
            connectingNode.y,
        );
    }

    const [pendingNode, setPendingNode] = useState(null);
    const [newNodeForm, setNewNodeForm] = useState({
        type: "",
        name: "",
        description: "",
        link: "",
    });

    const finishC = () => {
        if (label.trim() && pendingC) {
            setGraphData((prev) => ({
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

    useEffect(() => {
        if (!incomingNode) return;
        setGraphData((prev) => {
            const nodeExists = prev.nodes.some((n) => n.id === incomingNode.id);

            if (nodeExists) {
                console.warn("it alr exists");
                return prev;
            }

            console.log("yo if this works imma be suppa happy", incomingNode);
            return {
                ...prev,
                nodes: [...prev.nodes, incomingNode],
            };
        });
    }, [incomingNode]);

    useEffect(() => {
        setGraphData((prev) => {
            console.log("yay in graph data updated ");
            let currentNodes = [...prev.nodes];
            let currentLinks = [...prev.links];
            let hasChanges = false;

            scanEntries.forEach(([scan_id, updates]) => {
                updates.forEach((update) => {
                    if (!update.data) return;

                    if (update.data.certainty && update.data.certainty === "0")
                        return;
                    if (update.type === "ERROR") {
                        console.warn("yeah, ts is frying yo ahh");
                        return;
                    }

                    console.warn(update.type);

                    const newNodes = update.data.nodes || [];
                    const newLinks = update.data.links || [];

                    const existingNodeIds = new Set(
                        currentNodes.map((n) => n.id),
                    );
                    const nodesToAdd = newNodes.filter(
                        (n) => !existingNodeIds.has(n.id),
                    );

                    if (nodesToAdd.length > 0) {
                        currentNodes = [...currentNodes, ...nodesToAdd];
                        hasChanges = true;
                    }

                    const validNodeIds = new Set(currentNodes.map((n) => n.id));

                    const existingLinkStrings = new Set(
                        currentLinks.map(
                            (l) =>
                                `${l.source.id || l.source}-${l.target.id || l.target}-${l.label}`,
                        ),
                    );

                    const linksToAdd = newLinks.filter((l) => {
                        const isNotDuplicate = !existingLinkStrings.has(
                            `${l.source}-${l.target}-${l.label}`,
                        );
                        const sourceExists = validNodeIds.has(l.source);
                        const targetExists = validNodeIds.has(l.target);

                        if (!sourceExists || !targetExists) {
                            console.warn(
                                `data integrity issue from the backend: ${l.source} -> ${l.target}`,
                            );
                        }

                        return isNotDuplicate && sourceExists && targetExists;
                    });

                    if (linksToAdd.length > 0) {
                        currentLinks = [...currentLinks, ...linksToAdd];
                        hasChanges = true;
                    }
                });
            });

            if (!hasChanges) {
                return prev;
            }

            return {
                nodes: currentNodes,
                links: currentLinks,
            };
        });
    }, [scans]);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }
    }, []);

    const getNodeColor = (type) => {
        const colors = {
            Person: "#3b82f6",
            Company: "#f59e0b",
            CourtCase: "#ef4444",
            Document: "#10b981",
            SocialProfile: "#d946ef",
            Media: "#6366f1",
        };
        return colors[type] || "#9ca3af";
    };

    const finishNode = () => {
        if (newNodeForm.name.trim() && pendingNode && fgRef.current) {
            const graphCoords = fgRef.current.screen2GraphCoords(
                pendingNode.relX,
                pendingNode.relY,
            );

            const newNode = {
                id: `node-${Date.now()}`,
                label: newNodeForm.name.trim(),
                description: newNodeForm.description.trim(),
                link: newNodeForm.link.trim(),
                type: newNodeForm.type.trim(),
                x: graphCoords.x,
                y: graphCoords.y,
            };

            setGraphData((prev) => ({
                ...prev,
                nodes: [...prev.nodes, newNode],
            }));
        }
        setPendingNode(null);
    };

    return (
        <>
            <div className="relative w-full h-full">
                <div
                    className="flex-1 relative bg-secondary/40 w-full h-full cursor-pointer active:cursor-all-scroll"
                    ref={containerRef}
                    onMouseMoveCapture={handleMouseMove}
                >
                    <ForceGraph2D
                        width={dimensions.width}
                        ref={fgRef}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeLabel="label"
                        nodeColor={(node) => getNodeColor(node.type)}
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
                                } else {
                                    cancelConnection();
                                }
                                setConnectingNode(null);
                                setMousePos(null);
                            } else {
                                setSelectedNode(node);
                            }
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
                        linkCanvasObject={(link, ctx) => {
                            const MAX_FONT_SIZE = 4;
                            const LABEL_NODE_MARGIN = 12;
                            const start = link.source;
                            const end = link.target;

                            if (
                                typeof start !== "object" ||
                                typeof end !== "object"
                            )
                                return;

                            const textPos = Object.assign(
                                ...["x", "y"].map((c) => ({
                                    [c]: start[c] + (end[c] - start[c]) / 2,
                                })),
                            );

                            ctx.font = `${MAX_FONT_SIZE}px Sans-Serif`;
                            ctx.fillStyle = "gray";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(link.label, textPos.x, textPos.y);
                        }}
                    />
                    {connectingNode &&
                        sourceScreenPos &&
                        mousePos &&
                        !pendingC && (
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 text-highlight stroke-highlight">
                                <line
                                    x1={sourceScreenPos.x}
                                    y1={sourceScreenPos.y}
                                    x2={mousePos.x}
                                    y2={mousePos.y}
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                            </svg>
                        )}
                    {/* should move this tf outta here but it'll do for now */}
                    {pendingC && (
                        <div className="absolute top-0 left-0 m-10 bg-slate-800 border border-slate-600 shadow-2xl rounded-sm p-5 z-20 w-72">
                            <h3 className="text-slate-200 mb-3 text-sm font-medium">
                                Put yo connection in here:
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
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                                placeholder="idk"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => cancelConnection()}
                                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={finishC}
                                    className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors hover:cursor-pointer"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    )}

                    {/* this is getting obscene, this component is getting way too long, fac altadata schimbarea culorilor in tema */}
                    {pendingNode && (
                        <div className="absolute top-0 left-0 m-10 bg-slate-800 border border-slate-600 shadow-2xl rounded-sm p-5 z-20 w-80">
                            <h3 className="text-slate-200 mb-3 text-sm font-medium">
                                Create New Node:
                            </h3>
                            <div className="flex flex-col gap-3 mb-4">
                                <select
                                    autoFocus
                                    value={newNodeForm.type}
                                    onChange={(e) =>
                                        setNewNodeForm({
                                            ...newNodeForm,
                                            type: e.target.value,
                                        })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option
                                        value=""
                                        disabled
                                        className="text-slate-500"
                                    >
                                        Select a type...
                                    </option>
                                    {nodeTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    autoFocus
                                    type="text"
                                    value={newNodeForm.name}
                                    onChange={(e) =>
                                        setNewNodeForm({
                                            ...newNodeForm,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Name"
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
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Description"
                                />
                                <input
                                    type="text"
                                    value={newNodeForm.link}
                                    onChange={(e) =>
                                        setNewNodeForm({
                                            ...newNodeForm,
                                            link: e.target.value,
                                        })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") finishNode();
                                        if (e.key === "Escape")
                                            setPendingNode(null);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Link"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setPendingNode(null)}
                                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={finishNode}
                                    className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors hover:cursor-pointer"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* stupid ahh right click menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 min-w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {contextMenu.type === "background" ? (
                        <button
                            className="w-full text-left px-5 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors hover:cursor-pointer"
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
                            Add Node
                        </button>
                    ) : (
                        <button
                            className="w-full text-left px-5 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors hover:cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConnectingNode(contextMenu.node);
                                setContextMenu(null);
                            }}
                        >
                            Connect
                        </button>
                    )}
                </div>
            )}

            {selectedNode && (
                <Datasheet
                    data={selectedNode}
                    isOpen={selectedNode ? true : false}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </>
    );
}
