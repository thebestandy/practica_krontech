from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import uuid
import json
import re

from scrapers.anaf_portjust.anaf_nou import AnafScraper

from scrapers.worker import Worker

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
        # blueprint:
        # await manager.send_update(
        #     websocket,
        #     {
        #         "type": "status",
        #         "scan_id": scan_id,
        #         "target": target_name,
        #         "message": "functioneste",
        #         "progress": 5,
        #     },
        # )

        # aici va trebui inlocuit cu scraping logic
        # explicitly added hella data

        worker = Worker(
            websocket=websocket,
            manager=manager,
            scan_id=scan_id,
            target=target_name,
            searchType="person",
        )

        await worker.execute()

        await asyncio.sleep(5)

        await manager.send_update(
            websocket,
            {
                "type": "status",
                "scan_id": scan_id,
                "target": target_name,
                "message": "done",
                "data": {
                    "nodes": [
                        {
                            "id": "mock1",
                            "type": "SocialProfile",
                            "label": "ensure that ts still works",
                            "summary": "if this plots it works",
                            "url": "if it doesn't, welp, bad luck",
                        },
                    ],
                },
                "progress": 100,
            },
        )

        print("yes")

    except Exception as e:
        print("In exception, websockets: " + str(e))
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
                scan_id = str(uuid.uuid4())

                await manager.send_update(
                    websocket,
                    {"type": "SCAN_STARTED", "scan_id": scan_id, "target": target},
                )

                asyncio.create_task(perform_company_scan(websocket, scan_id, target))

            elif action == "PING":
                await manager.send_update(websocket, {"type": "PONG"})

            else:
                await manager.send_update(websocket, {"error": "Unknown command"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected.")
    except json.JSONDecodeError:
        await manager.send_update(websocket, {"error": "Invalid JSON payload format."})


def is_cui(target: str) -> bool:
    # ex cui: 123456 sau RO123456
    return bool(re.fullmatch(r"(RO)?\d+", target.strip(), re.IGNORECASE)) 


async def resolve_cuis(company_name: str) -> list[str]:
    scraper = AnafScraper()

    results = await asyncio.get_event_loop().run_in_executor(
        None, scraper.search_company, company_name
    )

    firms = results.get("data", results)
    if not isinstance(firms, list) or not firms:
        return []
    
    cuis = []
    for f in firms:
        cui = str(f.get("cui") or f.get("CUI") or "").strip()
        if cui:
            cuis.append(cui)

    return cuis


async def perform_company_scan(websocket: WebSocket, scan_id: str, target_name: str):
    # merge in background
    try:
        await asyncio.sleep(1)

        if is_cui(target_name):
            clean_cui = target_name.upper().replace("RO", "").strip()
            resolved_targets = [clean_cui]
            await manager.send_update(websocket, {
                "type": "status",
                "scan_id": scan_id,
                "target": target_name,
                "message": f"Identify target as CUI: {clean_cui}",
                "progress": 5,
            })
        else:
            await manager.send_update(websocket, {
                "type": "status",
                "scan_id": scan_id,
                "target": target_name,
                "message": f"Search CUI for '{target_name}' via ANAF...",
                "progress": 5,
            })

            try:
                cuis = await resolve_cuis(target_name)
            except Exception as anaf_err:
                print(f"ANAF lookup failed: {anaf_err}")
                cuis = []

            if cuis:
                resolved_targets = cuis
                await manager.send_update(websocket, {
                    "type": "status",
                    "scan_id": scan_id,
                    "target": target_name,
                    "message": f"Found {len(cuis)} CUIs: {', '.join(cuis)}",
                    "progress": 10,
                }) 
            else:
                resolved_targets = [target_name]
                await manager.send_update(websocket, {
                    "type": "status",
                    "scan_id": scan_id,
                    "target": target_name,
                    "message": f"CUI not found for '{target_name}', continue with original name.",
                    "progress": 10,
                }) 

        worker = Worker(
            websocket=websocket,
            manager=manager,
            scan_id=scan_id,
            # target=target_name,
            target = resolved_targets,
            searchType="company",
        )

        await worker.execute()

        await asyncio.sleep(3)

        await manager.send_update(
            websocket,
            {
                "type": "status",
                "scan_id": scan_id,
                "target": target_name,
                "message": "done",
                "data": {
                    "nodes": [
                        {
                            "id": "mock1",
                            "type": "company",
                            "label": "should work",
                            "summary": "pls",
                            "url": "",
                        },
                    ],
                },
                "progress": 100,
            },
        )

        print("yes")

    except Exception as e:
        print("In exception, websockets: " + str(e))
        await manager.send_update(
            websocket,
            {
                "type": "ERROR",
                "scan_id": scan_id,
                "target": target_name,
                "message": str(e) + " e rau frt",
            },
        )
