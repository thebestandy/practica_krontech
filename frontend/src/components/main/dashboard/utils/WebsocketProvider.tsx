import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import { WebsocketManager } from "../utils/websocketManager";

interface WebSocketContextType {
    connectionStatus: string;
    scans: Record<string, any[]>;
    startScan: (target: string) => void;
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

    const startScan = (target: string) => {
        if (wsClient.current && target) {
            console.log("websocket provider: scan did start");
            wsClient.current.send({
                action: "SCAN_PERSON",
                target: target,
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
