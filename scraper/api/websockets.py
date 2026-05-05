from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import uuid
import json

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.send_lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_update(self, websocket: WebSocket, message: dict):
        async with self.send_lock:
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending message: {e}")


manager = ConnectionManager()


async def perform_person_scan(websocket: WebSocket, scan_id: str, target_name: str):
    # merge in background
    try:
        await manager.send_update(
            websocket,
            {
                "type": "status",
                "scan_id": scan_id,
                "target": target_name,
                "message": "functioneste",
                "progress": 5,
            },
        )

        # aici va trebui inlocuit cu scraping logic
        await asyncio.sleep(2)
        await manager.send_update(
            websocket,
            {
                "type": "DATA_DISCOVERY",
                "scan_id": scan_id,
                "target": target_name,
                "source": "Portal Just",
                "data": {
                    "found_cases": 2,
                    "nodes": [{"id": "case1", "label": "Dosar 441/2025"}],
                },
            },
        )

        await asyncio.sleep(3)
        await manager.send_update(
            websocket,
            {
                "type": "DATA_DISCOVERY",
                "scan_id": scan_id,
                "target": target_name,
                "source": "Social Media",
                "data": {"profiles": ["LinkedIn: Radu Ionescu"]},
            },
        )

        await manager.send_update(
            websocket,
            {
                "type": "SCAN_COMPLETE",
                "scan_id": scan_id,
                "target": target_name,
                "message": "Scan finished.",
            },
        )

    except Exception as e:
        await manager.send_update(
            websocket,
            {
                "type": "ERROR",
                "scan_id": scan_id,
                "target": target_name,
                "message": str(e) + " e rau frt",
            },
        )


@router.websocket("/ws/engine")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await manager.send_update(websocket, {"error": "json error"})
                continue

            action = data.get("action")
            target = data.get("target")

            if action == "SCAN_PERSON":
                scan_id = str(uuid.uuid4())

                await manager.send_update(
                    websocket,
                    {"type": "SCAN_STARTED", "scan_id": scan_id, "target": target},
                )

                asyncio.create_task(perform_person_scan(websocket, scan_id, target))

            elif action == "SCAN_COMPANY":
                await manager.send_update(
                    websocket, {"status": "Company scan triggered"}
                )

            elif action == "PING":
                await manager.send_update(websocket, {"type": "PONG"})

            else:
                await manager.send_update(websocket, {"error": "Unknown command"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected.")
    except json.JSONDecodeError:
        await manager.send_update(websocket, {"error": "Invalid JSON payload format."})
