# Worker

import asyncio
from asyncio.tasks import as_completed

from scrapers.ani_pdf.ani_pdf_v2 import AniScraper

# from scrapers.seap_sicap.seap_sicap import ElicitatieScraper
from scrapers.seap_sicap.seap_sicap_nou import ElicitatieScraper

# from scrapers.anaf_portjust.anaf import AnafScraper
from scrapers.anaf_portjust.anaf_nou import AnafScraper

# from scrapers.anaf_portjust.portal_just import PortalJustScraper
from scrapers.anaf_portjust.portal_just_nou import PortalJustScraper

from scrapers.news.adevarul_nou import AdevarulScraper
from scrapers.news.digi24_nou import Digi24Scraper
from scrapers.news.g4media_nou import G4MediaScraper
from scrapers.news.hotnews_nou import HotNewsScraper

from scrapers.journalism.recorder_nou import RecorderScraper
from scrapers.journalism.riseproject_nou import RiseProjectScraper
from scrapers.journalism.zf_nou import ZFScraper


async def resolve_cuis(company_name):
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


class Worker:
    def __init__(self, websocket, manager, scan_id, target, searchType):
        self.target = target
        self.ws = websocket
        self.scan_id = scan_id
        self.manager = manager
        self.scrapers = []
        self.timeout = []
        self.insinuations = []
        self.searchType = searchType

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

        if self.searchType == "person":
            queue = [
                asyncio.create_task(SicapScraper().run(self.target)),
                # asyncio.create_task(SeapScraper().run(self.target)),
                asyncio.create_task(
                    asyncio.to_thread(AniScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(PortalJustScraper().search, self.target)
                ),
                # asyncio.create_task(
                #     asyncio.to_thread(ElicitatieScraper().search, self.target)
                # ),
                asyncio.create_task(
                    asyncio.to_thread(AnafScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(AdevarulScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(Digi24Scraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(G4MediaScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(HotNewsScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(RecorderScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(RiseProjectScraper().search, self.target)
                ),
                asyncio.create_task(asyncio.to_thread(ZFScraper().search, self.target)),
            ]
        else:
            await self.manager.send_update(
                self.ws,
                {
                    "type": "Status",
                    "scan_id": self.scan_id,
                    "message": "Resolving company identity...",
                },
            )

            await asyncio.sleep(2)

            # some super fancy stuff here

            cui_targets = await resolve_cuis(self.target)
            name_target = self.target

            if cui_targets:
                cui_target = cui_targets[0]

                await self.manager.send_update(
                    self.ws,
                    {
                        "type": "Status",
                        "scan_id": self.scan_id,
                        "message": f"Found {name_target} with CUI {cui_target}",
                        "progress": 15,
                    },
                )

            else:
                cui_target = self.target

                await self.manager.send_update(
                    self.ws,
                    {
                        "type": "Status",
                        "scan_id": self.scan_id,
                        "message": "Could not find CUI. Resorting to Company name",
                    },
                )

            queue = [
                # asyncio.create_task(SicapScraper().run(self.target)),
                # asyncio.create_task(SeapScraper().run(self.target)),
                # asyncio.create_task(asyncio.to_thread(AniScraper().search, self.target)),
                asyncio.create_task(
                    asyncio.to_thread(PortalJustScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(ElicitatieScraper().search, cui_target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(AnafScraper().search, cui_target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(AdevarulScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(Digi24Scraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(G4MediaScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(HotNewsScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(RecorderScraper().search, self.target)
                ),
                asyncio.create_task(
                    asyncio.to_thread(RiseProjectScraper().search, self.target)
                ),
                asyncio.create_task(asyncio.to_thread(ZFScraper().search, self.target)),
            ]

        for finished_task in asyncio.as_completed(queue):
            try:
                data = await finished_task

                await self.manager.send_update(
                    self.ws,
                    {
                        "scan_id": self.scan_id,
                        "data": data,
                        "target": self.target,
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
                "scan_id": self.scan_id,
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
                # {
                #     "id": "p9",
                #     "type": "lmao",
                #     "label": "mock ahh nga",
                #     "summary": "bla bla bla",
                #     "url": "N/A",
                #     "properties": {
                #         "dob": "1974-03-12",
                #         "nationality": "rumenia",
                #         "pep_status": True,
                #     },
                # },
            ],
        }


class SeapScraper:
    async def run(self, target):
        await asyncio.sleep(5)

        return {
            "type": "seap scraper",
            "message": "seap scraper",
            "nodes": [
                # {
                #     "id": "p7",
                #     "type": "lmao",
                #     "label": "seap",
                #     "summary": "mock scraper",
                #     "url": "N/A",
                #     "properties": {
                #         "dob": "1974-03-12",
                #         "nationality": "rumenia",
                #         "pep_status": True,
                #     },
                # },
            ],
        }
