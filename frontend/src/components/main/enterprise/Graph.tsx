import React, { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
// Dacă ai Datasheet, importă-l cu calea corectă. Deocamdată îl lăsăm comentat ca să nu dea eroare de modul lipsă.
// import Datasheet from "../../utils/Datasheet";

const demoData = {
    nodes: [
        {
            id: "p1",
            type: "Person",
            label: "Radu Ionescu",
            summary: "Businessman & Former state secretary",
        },
        {
            id: "c1",
            type: "Company",
            label: "InfraBuild Solutions SRL",
            summary: "Construction firm",
        },
        {
            id: "c5",
            type: "Company",
            label: "GreenRoute Construct",
            summary: "Subcontractor",
        },
        {
            id: "case1",
            type: "CourtCase",
            label: "Dosar 441/2/2025",
            summary: "Investigation into irregularities",
        },
        {
            id: "doc1",
            type: "Document",
            label: "Audit Report 2024",
            summary: "Court-ordered audit",
        },
    ],
    links: [
        { source: "p1", target: "c1", label: "EXECUTIVE_ROLE" },
        { source: "case1", target: "c1", label: "INVESTIGATES" },
        { source: "c1", target: "c5", label: "SUBCONTRACTS_TO" },
        { source: "c1", target: "doc1", label: "SUBJECT_OF_AUDIT" },
        { source: "c5", target: "doc1", label: "MENTIONED_IN_AUDIT" },
    ],
};

export default function Graph() {
    // Îi spunem explicit lui TS că putem avea `null` SAU un obiect oarecare (nodul selectat)
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Îi spunem lui TS că acest ref va fi un element <div>
    const containerRef = useRef<HTMLDivElement>(null);

    const [graphData] = useState(demoData);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }

        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Adăugăm (type: string) și specificăm tipul dicționarului de culori
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
        <>
            <div className="relative w-full h-full">
                <div
                    className="flex-1 relative bg-secondary/10 w-full h-full cursor-grab active:cursor-grabbing"
                    ref={containerRef}
                >
                    <ForceGraph2D
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeLabel="label"
                        nodeColor={(node: any) => getNodeColor(node.type)}
                        nodeRelSize={8}
                        linkColor={() => "#475569"}
                        linkWidth={2}
                        onNodeClick={(node: any) => setSelectedNode(node)}
                        linkCanvasObjectMode={() => "after"}
                        linkCanvasObject={(
                            link: any,
                            ctx: CanvasRenderingContext2D,
                        ) => {
                            const MAX_FONT_SIZE = 4;
                            const start = link.source;
                            const end = link.target;

                            if (
                                typeof start !== "object" ||
                                typeof end !== "object"
                            )
                                return;

                            // Scăpăm de logica complexă de array mapping care deranja TypeScript
                            const textPos = {
                                x: start.x + (end.x - start.x) / 2,
                                y: start.y + (end.y - start.y) / 2,
                            };

                            ctx.font = `${MAX_FONT_SIZE}px JetBrains Mono, monospace`;
                            ctx.fillStyle = "#94a3b8";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText(link.label, textPos.x, textPos.y);
                        }}
                    />
                </div>
            </div>

            {/* Decomentează bucata asta când rezolvi calea către importul de Datasheet */}
            {/* {selectedNode && (
                <Datasheet
                    data={selectedNode}
                    isOpen={selectedNode !== null}
                    onClose={() => setSelectedNode(null)}
                />
            )} */}
        </>
    );
}
