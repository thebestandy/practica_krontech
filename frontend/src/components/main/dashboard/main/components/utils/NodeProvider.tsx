import React, { createContext, useContext, useState } from "react";

interface GraphNode {
    id: string;
    type: string;
    label: string;
    summary?: string;
    url?: string;
}

interface GraphSelectionContextType {
    incomingNode: GraphNode | null;
    sendNodeToGraph: (node: GraphNode) => void;
}

const GraphSelectionContext = createContext<
    GraphSelectionContextType | undefined
>(undefined);

export function GraphSelectionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [incomingNode, setIncomingNode] = useState<GraphNode | null>(null);

    const sendNodeToGraph = (node: GraphNode) => {
        setIncomingNode(node);
    };

    return (
        <GraphSelectionContext.Provider
            value={{ incomingNode, sendNodeToGraph }}
        >
            {children}
        </GraphSelectionContext.Provider>
    );
}

export function useGraphSelection() {
    const context = useContext(GraphSelectionContext);
    if (context === undefined) {
        throw new Error("nga iar ai uitat sa wrap ts");
    }
    return context;
}
