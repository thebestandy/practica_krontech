import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import graphData from "./mock_data.json";
import Datasheet from "./utils/Datasheet";

export default function Graph() {
    const nodes = graphData["nodes"];
    const edges = graphData["links"];

    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef(null);

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
                    className="flex-1 relative bg-purple-950 w-full h-full"
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
