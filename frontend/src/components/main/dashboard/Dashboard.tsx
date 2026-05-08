import React, { useState, useEffect, useRef, type FormEvent } from "react";
import { WebsocketManager } from "./utils/websocketManager";

export default function Dashboard() {
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [searchTarget, setSearchTarget] = useState("");
    const [scans, setScans] = useState<Record<string, any[]>>({});
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const wsClient = useRef<WebsocketManager | null>(null);

    useEffect(() => {
        const client = new WebsocketManager("ws://127.0.0.1:8001/ws/engine");

        client.onStatusChange = (status) => {
            console.log("not called");
            setConnectionStatus(status);
        };

        client.onMessage = (data) => {
            if (data && data.scan_id) {
                setScans((prevScans) => {
                    const existingMessages = prevScans[data.scan_id] || [];

                    if (data.type === "SCAN_STARTED") {
                        setActiveTab(data.scan_id);
                    }

                    return {
                        ...prevScans,
                        [data.scan_id]: [...existingMessages, data],
                    };
                });
            } else {
                console.log("received message without id");
            }
        };

        client.connect();
        wsClient.current = client;

        return () => {
            client.disconnect();
        };
    }, []);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();

        if (wsClient.current && searchTarget) {
            wsClient.current.send({
                action: "SCAN_PERSON",
                target: searchTarget,
            });
            setSearchTarget("");
        }
    };

    const activeMessages = activeTab ? scans[activeTab] || [] : [];

    return (
        <div className="p-20 m-auto max-w-300">
            <div className="mb-10">
                Status: <span>{connectionStatus}</span>
            </div>

            <form
                onSubmit={handleSearch}
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
                <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder="numele persoana"
                    className="flex-1 m-10 p-5 size-10"
                />
                <button
                    type="submit"
                    className="hover:cursor-pointer border border-white m-10 p-2"
                >
                    Cautare noua
                </button>
            </form>

            {Object.keys(scans).length > 0 && (
                <div className="flex gap-8 mb-10 overflow-x-auto">
                    {Object.entries(scans).map(([scanId, msgs]) => {
                        const tabLabel =
                            msgs.length > 0
                                ? msgs[0].target
                                : scanId.substring(0, 8);
                        const isActive = activeTab === scanId;

                        return (
                            <button
                                key={scanId}
                                onClick={() => setActiveTab(scanId)}
                                className="p-2 hover:cursor-pointer"
                                style={{
                                    backgroundColor: isActive
                                        ? "#00ff00"
                                        : "#333",
                                    color: isActive ? "#000" : "#fff",
                                }}
                            >
                                {tabLabel}
                            </button>
                        );
                    })}
                </div>
            )}

            <div
                style={{
                    backgroundColor: "#1e1e1e",
                    padding: "20px",
                    borderRadius:
                        Object.keys(scans).length > 0 ? "0 8px 8px 8px" : "8px",
                    height: "450px",
                    overflowY: "auto",
                }}
            >
                {!activeTab ? (
                    <p style={{ color: "#888" }}>waiting for data</p>
                ) : activeMessages.length === 0 ? (
                    <p style={{ color: "#888" }}>
                        connecting to the fastapi backend
                    </p>
                ) : (
                    activeMessages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: "10px",
                                borderBottom: "1px solid #333",
                                paddingBottom: "10px",
                            }}
                        >
                            <strong>[{msg.type || "INFO"}]</strong>{" "}
                            {msg.target && `Target: ${msg.target} | `}
                            {msg.type === "status" && (
                                <span>{msg.message}</span>
                            )}
                            {msg.type === "SCAN_COMPLETE" && (
                                <span style={{ color: "#00ccff" }}>
                                    {msg.message}
                                </span>
                            )}
                            {msg.type === "ERROR" && (
                                <span style={{ color: "red" }}>
                                    {msg.message}
                                </span>
                            )}
                            {msg.type === "DATA_DISCOVERY" && (
                                <div
                                    style={{
                                        color: "#ffaa00",
                                        marginLeft: "20px",
                                        marginTop: "5px",
                                    }}
                                >
                                    <em>Source: {msg.source}</em>
                                    <pre
                                        style={{ margin: 0, marginTop: "5px" }}
                                    >
                                        {JSON.stringify(msg.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
