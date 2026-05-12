# Worker

import asyncio
from asyncio.tasks import as_completed

from scrapers.ani_pdf.ani_pdf_v2 import AniScraper
# from scrapers.seap_sicap.seap_sicap import ElicitatieScraper
from scrapers.seap_sicap.seap_sicap_nou import ElicitatieScraper
# from scrapers.anaf_portjust.anaf import AnafScraper
from scrapers.anaf_portjust.anaf_nou import AnafScraper
from scrapers.anaf_portjust.portal_just import PortalJustScraper


class Worker:
    def __init__(self, websocket, manager, scan_id, target):
        self.target = target
        self.ws = websocket
        self.scan_id = scan_id
        self.manager = manager
        self.scrapers = []
        self.timeout = []
        self.insinuations = []

    async def execute(self):
        await self.manager.send_update(
            self.ws,
            {
                "type": "Initialization",
                "scan_id": self.scan_id,
                "message": "Computing scraper sequence",
                "progress": 5,
            },
        )

        queue = [
            asyncio.create_task(SicapScraper().run(self.target)),
            asyncio.create_task(SeapScraper().run(self.target)),
            asyncio.create_task(asyncio.to_thread(AniScraper().search, self.target)),
            # asyncio.create_task(
            #     asyncio.to_thread(ElicitatieScraper().search, self.target)
            # ),
            # asyncio.create_task(asyncio.to_thread(AnafScraper().search, self.target)),
            # asyncio.create_task(asyncio.to_thread(PortalJustScraper().search, self.target)),
        ]

        for finished_task in asyncio.as_completed(queue):
            try:
                data = await finished_task

                await self.manager.send_update(
                    self.ws,
                    {
                        "scan_id": self.scan_id,
                        "data": data,
                    },
                )
            except Exception as e:
                print(str(e))
                await self.manager.send_update(
                    self.ws, {"type": "error", "error": str(e)}
                )

        await self.manager.send_update(
            self.ws,
            {
                "type": "worker finished",
                "scan": self.scan_id,
                "target": self.target,
                "progress": 95,
                "insinuations": self.insinuations
                if self.insinuations
                else "No implicators found",
            },
        )


class SicapScraper:
    async def run(self, target):
        await asyncio.sleep(5)

        return {
            "type": "sicap scraper",
            "found_cases": 7,
            "message": "mock data",
            "nodes": [
                {
                    "id": "p9",
                    "type": "lmao",
                    "label": "mock ahh nga",
                    "summary": "bla bla bla",
                    "url": "N/A",
                    "properties": {
                        "dob": "1974-03-12",
                        "nationality": "rumenia",
                        "pep_status": True,
                    },
                },
            ],
        }


class SeapScraper:
    async def run(self, target):
        await asyncio.sleep(5)

        return {
            "type": "seap scraper",
            "message": "seap scraper",
            "nodes": [
                {
                    "id": "p7",
                    "type": "lmao",
                    "label": "seap",
                    "summary": "mock scraper",
                    "url": "N/A",
                    "properties": {
                        "dob": "1974-03-12",
                        "nationality": "rumenia",
                        "pep_status": True,
                    },
                },
            ],
        }
