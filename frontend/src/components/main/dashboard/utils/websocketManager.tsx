export class WebsocketManager {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    public onMessage?: (data: any) => void;
    public onStatusChange?: (status: "connected" | "disconnected") => void;

    constructor(url: string) {
        this.url = url;
    }

    public connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("websocket connected");
            this.onStatusChange?.("connected");
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.onMessage?.(data);
            } catch (err) {
                console.log("error in onopen: " + err);
            }
        };

        this.ws.onclose = () => {
            this.onStatusChange?.("disconnected");
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.log("websocket error: " + error);
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            console.log("reconnecting...");
            this.connect();
        }, 3000);
    }

    public send(data: object) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.log("send was tried: websocket isn't open");
        }
    }

    public disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
        }
    }
}
