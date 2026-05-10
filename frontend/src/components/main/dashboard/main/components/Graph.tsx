import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import mockData from "./mock_data.json";
import Datasheet from "./utils/Datasheet";
import { useWebSocket } from "../../utils/WebsocketProvider";
import { useGraphSelection } from "./utils/NodeProvider";

export default function Graph() {
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef(null);

    const { scans } = useWebSocket();
    const [graphData, setGraphData] = useState(mockData);

    const nodes = graphData["nodes"];
    const edges = graphData["links"];

    const scanEntries = Object.entries(scans);

    const { incomingNode } = useGraphSelection();

    useEffect(() => {
        if (!incomingNode) return; // shutup the linter
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

    return (
        <>
            <div className="relative w-full h-full">
                <div
                    className="flex-1 relative bg-secondary/40 w-full h-full"
                    ref={containerRef}
                >
                    <ForceGraph2D
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeLabel="label"
                        nodeColor={(node) => getNodeColor(node.type)}
                        nodeRelSize={6}
                        linkColor={() => "#cbd5e1"}
                        linkWidth={2}
                        onNodeClick={(node) => setSelectedNode(node)}
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
                </div>
            </div>

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
