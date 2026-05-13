import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import { WebsocketManager } from "../utils/websocketManager";

export interface ScanTargets {
    company?: string;
    person?: string;
}

interface WebSocketContextType {
    connectionStatus: string;
    scans: Record<string, any[]>;
    startScan: (targets: ScanTargets) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined,
);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [scans, setScans] = useState<Record<string, any[]>>({});
    const wsClient = useRef<WebsocketManager | null>(null);

    useEffect(() => {
        const client = new WebsocketManager("ws://127.0.0.1:8001/ws/engine");

        client.onStatusChange = (status) => {
            console.log("Websocket provider: status: " + status);
            setConnectionStatus(status);
        };

        client.onMessage = (data) => {
            console.log(data);
            if (data && data.scan_id) {
                setScans((prev) => ({
                    ...prev,
                    [data.scan_id]: [...(prev[data.scan_id] || []), data],
                }));
            }
        };

        client.connect();
        wsClient.current = client;

        return () => client.disconnect();
    }, []);

    const startScan = (targets: ScanTargets) => {
        if (!wsClient.current) {
            return;
        }

        if (targets.person) {
            console.log("websocket provider: scan did start it's a person btw");
            wsClient.current.send({
                action: "SCAN_PERSON",
                target: targets.person,
            });
        }

        if (targets.company) {
            console.log(
                "websocket provider: scan did start it's a company btw",
            );
            wsClient.current.send({
                action: "SCAN_COMPANY",
                target: targets.company,
            });
        }
    };

    return (
        <WebSocketContext.Provider
            value={{ connectionStatus, scans, startScan }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error("not wrapped in the websocket provider");
    }
    return context;
}
