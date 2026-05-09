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
        # explicitly added hella data
        await asyncio.sleep(5)
        await manager.send_update(
            websocket,
            {
                "type": "DATA_DISCOVERY",
                "scan_id": scan_id,
                "target": target_name,
                "source": "Portal Just",
                "data": {
                    "found_cases": 7,
                    "nodes": [
                        {
                            "id": "p1",
                            "type": "Person",
                            "label": "Radu Ionescu",
                            "summary": "Businessman active in infrastructure and energy sectors. Former state secretary in the Ministry of Transport (2016–2018).",
                            "url": "N/A",
                            "properties": {
                                "dob": "1974-03-12",
                                "nationality": "Romanian",
                                "pep_status": True,
                            },
                        },
                        {
                            "id": "p4",
                            "type": "Person",
                            "label": "Gheorghe Munteanu",
                            "summary": "Former judge at Tribunalul București, retired 2021. Linked to multiple infrastructure cases.",
                            "url": "N/A",
                            "properties": {
                                "dob": "1958-07-04",
                                "nationality": "Romanian",
                                "pep_status": True,
                            },
                        },
                        {
                            "id": "p5",
                            "type": "Person",
                            "label": "Cristina Vlad",
                            "summary": "Notary public in Ilfov County. Authenticated several company transfers linked to InfraBuild.",
                            "url": "N/A",
                        },
                        {
                            "id": "c1",
                            "type": "Company",
                            "label": "InfraBuild Solutions SRL",
                            "summary": "Construction firm with rapid growth in public sector contracts.",
                            "url": "https://recom.onrc.ro/infrabuild-solutions",
                            "properties": {
                                "cui": "RO28834512",
                                "reg_no": "J40/3821/2012",
                                "capital": 850000,
                                "employees": 142,
                                "status": "Active",
                            },
                        },
                        {
                            "id": "c5",
                            "type": "Company",
                            "label": "GreenRoute Construct SRL",
                            "summary": "Subcontractor frequently used by InfraBuild on motorway projects.",
                            "url": "https://recom.onrc.ro/greenroute-construct",
                            "properties": {
                                "cui": "RO31245900",
                                "reg_no": "J40/8812/2015",
                                "capital": 200000,
                                "employees": 38,
                                "status": "Active",
                            },
                        },
                        {
                            "id": "c6",
                            "type": "Company",
                            "label": "VoltTech Energy SRL",
                            "summary": "Energy infrastructure firm. Shared office address with InfraBuild until 2022.",
                            "url": "https://recom.onrc.ro/volttech-energy",
                            "properties": {
                                "cui": "RO29901234",
                                "reg_no": "J40/5512/2013",
                                "capital": 450000,
                                "status": "Active",
                            },
                        },
                        {
                            "id": "c7",
                            "type": "Company",
                            "label": "Orizont Holding SA",
                            "summary": "Offshore-linked holding company registered in Romania. Suspected beneficial owner: Radu Ionescu.",
                            "url": "https://recom.onrc.ro/orizont-holding",
                            "properties": {
                                "cui": "RO22100099",
                                "reg_no": "J40/1201/2008",
                                "capital": 3200000,
                                "status": "Active",
                            },
                        },
                        {
                            "id": "case1",
                            "type": "CourtCase",
                            "label": "Dosar 441/2/2025",
                            "summary": "Investigation into procurement irregularities involving InfraBuild Solutions SRL. Prosecutor: DNA Cluj.",
                            "url": "https://portal.just.ro/441/2025",
                            "properties": {
                                "court": "Tribunalul Cluj",
                                "status": "In judecată",
                                "filed_date": "2025-01-14",
                                "charges": ["evaziune fiscală", "abuz în serviciu"],
                            },
                        },
                        {
                            "id": "case2",
                            "type": "CourtCase",
                            "label": "Dosar 882/3/2023",
                            "summary": "Civil litigation between GreenRoute Construct and CNAIR over unpaid subcontracting invoices.",
                            "url": "https://portal.just.ro/882/2023",
                            "properties": {
                                "court": "Tribunalul București",
                                "status": "Soluționat",
                                "filed_date": "2023-06-20",
                            },
                        },
                        {
                            "id": "case3",
                            "type": "CourtCase",
                            "label": "Dosar 1204/1/2024",
                            "summary": "Criminal file opened by DIICOT regarding money laundering through Orizont Holding SA.",
                            "url": "https://portal.just.ro/1204/2024",
                            "properties": {
                                "court": "Curtea de Apel București",
                                "status": "În urmărire penală",
                                "filed_date": "2024-03-05",
                                "charges": [
                                    "spălare de bani",
                                    "constituirea unui grup infracțional organizat",
                                ],
                            },
                        },
                        {
                            "id": "case4",
                            "type": "CourtCase",
                            "label": "Dosar 309/4/2022",
                            "summary": "Administrative dispute over tender annulment. InfraBuild challenged CNAIR decision in court.",
                            "url": "https://portal.just.ro/309/2022",
                            "properties": {
                                "court": "Curtea de Apel Cluj",
                                "status": "Soluționat — respins",
                                "filed_date": "2022-11-08",
                            },
                        },
                    ],
                    "links": [
                        {
                            "source": "p1",
                            "target": "c1",
                            "label": "EXECUTIVE_ROLE",
                            "confidence": 0.92,
                            "properties": {"role": "Administrator", "since": "2012"},
                        },
                        {
                            "source": "p1",
                            "target": "c7",
                            "label": "BENEFICIAL_OWNER",
                            "confidence": 0.78,
                            "properties": {
                                "ownership_pct": "~60%",
                                "source": "ONRC filings",
                            },
                        },
                        {
                            "source": "p1",
                            "target": "c6",
                            "label": "SHAREHOLDER",
                            "confidence": 0.85,
                            "properties": {"ownership_pct": "35%", "until": "2022"},
                        },
                        {
                            "source": "p4",
                            "target": "case1",
                            "label": "PRESIDED_OVER",
                            "confidence": 0.80,
                            "properties": {"role": "Judecător"},
                        },
                        {
                            "source": "p5",
                            "target": "c7",
                            "label": "AUTHENTICATED_TRANSFER",
                            "confidence": 0.91,
                            "properties": {"date": "2020-04-15"},
                        },
                        {
                            "source": "case1",
                            "target": "c1",
                            "label": "INVESTIGATES",
                            "confidence": 0.88,
                        },
                        {
                            "source": "case3",
                            "target": "c7",
                            "label": "INVESTIGATES",
                            "confidence": 0.83,
                        },
                        {
                            "source": "case2",
                            "target": "c5",
                            "label": "INVOLVES",
                            "confidence": 0.95,
                        },
                        {
                            "source": "case4",
                            "target": "c1",
                            "label": "INVOLVES",
                            "confidence": 0.97,
                        },
                        {
                            "source": "c1",
                            "target": "c5",
                            "label": "SUBCONTRACTS_TO",
                            "confidence": 0.93,
                            "properties": {
                                "contract_value_eur": 2400000,
                                "year": "2023",
                            },
                        },
                        {
                            "source": "c7",
                            "target": "c1",
                            "label": "PARENT_COMPANY",
                            "confidence": 0.74,
                        },
                        {
                            "source": "c6",
                            "target": "c1",
                            "label": "SHARED_ADDRESS",
                            "confidence": 0.89,
                            "properties": {
                                "address": "Str. Academiei 14, București",
                                "until": "2022",
                            },
                        },
                    ],
                },
                "progress": 15,
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
                "data": {
                    "nodes": [
                        {
                            "id": "p3",
                            "type": "Person",
                            "label": "Victor Dumitrescu",
                            "summary": "Regional procurement official at CNAIR Iași regional office. Member of board evaluation committees 2021–2024.",
                            "url": "N/A",
                            "properties": {
                                "employer": "CNAIR SA",
                                "pep_status": True,
                            },
                        },
                        {
                            "id": "p6",
                            "type": "Person",
                            "label": "Mihai Apostol",
                            "summary": "Lobbyist and former parliamentary advisor. Known associate of Radu Ionescu on LinkedIn.",
                            "url": "https://linkedin.com/in/mihaiapostol",
                        },
                        {
                            "id": "p7",
                            "type": "Person",
                            "label": "Elena Drăghici",
                            "summary": "Civil servant at Ministerul Transporturilor. Approved feasibility study for A8 motorway section.",
                            "url": "N/A",
                            "properties": {"pep_status": True},
                        },
                        {
                            "id": "p8",
                            "type": "Person",
                            "label": "Bogdan Tănase",
                            "summary": "InfraBuild project manager. Posted photos at Infrastructure Tender 2024 gala on Facebook.",
                            "url": "https://facebook.com/bogdan.tanase.infra",
                        },
                        {
                            "id": "event1",
                            "type": "Event",
                            "label": "Infrastructure Tender 2024",
                            "summary": "Regional infrastructure contract worth €48M for A8 motorway section. Won by InfraBuild Solutions SRL.",
                            "url": "https://e-licitatie.ro/tender/A8-2024",
                            "properties": {
                                "value_eur": 48000000,
                                "contracting_authority": "CNAIR SA",
                                "award_date": "2024-07-22",
                                "cpv_code": "45233120-6",
                            },
                        },
                        {
                            "id": "event2",
                            "type": "Event",
                            "label": "Tender DN7 Rehabilitation 2022",
                            "summary": "€12M road rehabilitation contract. InfraBuild was sole valid bidder.",
                            "url": "https://e-licitatie.ro/tender/DN7-2022",
                            "properties": {
                                "value_eur": 12000000,
                                "contracting_authority": "CNAIR SA",
                                "award_date": "2022-09-10",
                                "bidders": 1,
                            },
                        },
                        {
                            "id": "event3",
                            "type": "Event",
                            "label": "Energy Grid Upgrade Tender 2023",
                            "summary": "€7.5M electrical infrastructure upgrade. VoltTech Energy SRL won.",
                            "url": "https://e-licitatie.ro/tender/GRID-2023",
                            "properties": {
                                "value_eur": 7500000,
                                "contracting_authority": "Transelectrica SA",
                                "award_date": "2023-04-18",
                            },
                        },
                        {
                            "id": "org1",
                            "type": "Organization",
                            "label": "CNAIR SA",
                            "summary": "Compania Națională de Administrare a Infrastructurii Rutiere. Main contracting authority for road projects.",
                            "url": "https://www.cnair.ro",
                        },
                        {
                            "id": "org2",
                            "type": "Organization",
                            "label": "DNA Cluj",
                            "summary": "Direcția Națională Anticorupție – serviciul teritorial Cluj. Handles case 441/2/2025.",
                            "url": "https://www.pna.ro/despre/structura-teritoriala/cluj",
                        },
                    ],
                    "links": [
                        {
                            "source": "p3",
                            "target": "event1",
                            "label": "OVERSEES",
                            "confidence": 0.91,
                            "properties": {"role": "Președinte comisie evaluare"},
                        },
                        {
                            "source": "p3",
                            "target": "event2",
                            "label": "OVERSEES",
                            "confidence": 0.88,
                        },
                        {
                            "source": "p6",
                            "target": "p1",
                            "label": "ASSOCIATE_OF",
                            "confidence": 0.70,
                            "properties": {
                                "platform": "LinkedIn",
                                "interactions": "frequent",
                            },
                        },
                        {
                            "source": "p7",
                            "target": "event1",
                            "label": "APPROVED_STUDY",
                            "confidence": 0.82,
                            "properties": {
                                "document": "Studiu de fezabilitate A8 2023"
                            },
                        },
                        {
                            "source": "p8",
                            "target": "c1",
                            "label": "EMPLOYED_BY",
                            "confidence": 0.97,
                        },
                        {
                            "source": "p8",
                            "target": "event1",
                            "label": "ATTENDED",
                            "confidence": 0.99,
                            "properties": {"source": "Facebook public post"},
                        },
                        {
                            "source": "c1",
                            "target": "event1",
                            "label": "WON_CONTRACT",
                            "confidence": 0.95,
                            "properties": {"value_eur": 48000000},
                        },
                        {
                            "source": "c1",
                            "target": "event2",
                            "label": "WON_CONTRACT",
                            "confidence": 0.95,
                            "properties": {"value_eur": 12000000},
                        },
                        {
                            "source": "c6",
                            "target": "event3",
                            "label": "WON_CONTRACT",
                            "confidence": 0.93,
                        },
                        {
                            "source": "p3",
                            "target": "p1",
                            "label": "INFORMAL_CONTACT",
                            "confidence": 0.52,
                            "properties": {
                                "source": "Social media mutual follows, joint event attendance"
                            },
                        },
                        {
                            "source": "event1",
                            "target": "org1",
                            "label": "ISSUED_BY",
                            "confidence": 1.0,
                        },
                        {
                            "source": "event2",
                            "target": "org1",
                            "label": "ISSUED_BY",
                            "confidence": 1.0,
                        },
                        {
                            "source": "case1",
                            "target": "org2",
                            "label": "PROSECUTED_BY",
                            "confidence": 1.0,
                        },
                    ],
                },
                "progress": 35,
            },
        )

        await manager.send_update(
            websocket,
            {
                "type": "SCAN_COMPLETE",
                "scan_id": scan_id,
                "target": target_name,
                "data": {
                    "nodes": [
                        {
                            "id": "soc1",
                            "type": "SocialProfile",
                            "label": "LinkedIn: Radu Ionescu",
                            "summary": "Executive roles listed: Administrator InfraBuild, Board Member Orizont Holding, Advisor VoltTech Energy.",
                            "url": "https://linkedin.com/in/raduionescu",
                            "properties": {
                                "connections": 847,
                                "verified": False,
                            },
                        },
                        {
                            "id": "soc2",
                            "type": "SocialProfile",
                            "label": "Facebook: Radu Ionescu",
                            "summary": "Public profile. Posts include attendance at infrastructure ministry events and CNAIR galas.",
                            "url": "https://facebook.com/radu.ionescu.infra",
                        },
                        {
                            "id": "soc3",
                            "type": "SocialProfile",
                            "label": "Twitter/X: @raduionescu_ro",
                            "summary": "Inactive since 2023. Historical posts mention lobbying for PPP infrastructure projects.",
                            "url": "https://x.com/raduionescu_ro",
                        },
                        {
                            "id": "media1",
                            "type": "Media",
                            "label": "Recorder.ro — Investigative Article (2024)",
                            "summary": "Detailed investigation into preferential contract allocation on A8 motorway section. Names InfraBuild and CNAIR officials.",
                            "url": "https://recorder.ro/infrabuild-a8-contract-preferential",
                            "properties": {
                                "published": "2024-09-15",
                                "author": "Recorder investigativ",
                                "mentions": [
                                    "Radu Ionescu",
                                    "InfraBuild Solutions",
                                    "Victor Dumitrescu",
                                ],
                            },
                        },
                        {
                            "id": "media2",
                            "type": "Media",
                            "label": "G4Media — Report on DNA Investigation (2025)",
                            "summary": "Reports on DNA Cluj opening criminal file against InfraBuild executives. Quotes anonymous prosecution sources.",
                            "url": "https://g4media.ro/dna-cluj-infrabuild-2025",
                            "properties": {
                                "published": "2025-01-20",
                                "author": "G4Media",
                            },
                        },
                        {
                            "id": "media3",
                            "type": "Media",
                            "label": "Digi24 — Interview Radu Ionescu (2023)",
                            "summary": "TV interview where Ionescu denied any wrongdoing and described InfraBuild as a legitimate business.",
                            "url": "https://digi24.ro/stiri/radu-ionescu-infrabuild-interviu-2023",
                            "properties": {
                                "published": "2023-05-10",
                                "channel": "Digi24",
                            },
                        },
                        {
                            "id": "media4",
                            "type": "Media",
                            "label": "PressOne — Offshore Connections (2024)",
                            "summary": "Investigation linking Orizont Holding SA to a Cyprus-registered entity through leaked documents.",
                            "url": "https://pressone.ro/orizont-holding-offshore-cyprus",
                            "properties": {
                                "published": "2024-02-28",
                                "author": "PressOne investigativ",
                            },
                        },
                    ],
                },
                "message": "Scan almost finished.",
                "progress": 72,
            },
        )

        await asyncio.sleep(2)

        await manager.send_update(
            websocket,
            {
                "type": "DATA_DISCOVERY",
                "scan_id": scan_id,
                "target": target_name,
                "source": "Recorder.ro / G4Media / PressOne",
                "data": {
                    "nodes": [
                        {
                            "id": "c8",
                            "type": "Company",
                            "label": "Meridian Invest Ltd (Cyprus)",
                            "summary": "Cyprus-registered entity. Named in PressOne leak as beneficial recipient of funds from Orizont Holding.",
                            "url": "N/A",
                            "properties": {
                                "jurisdiction": "Cyprus",
                                "registered": "2009",
                                "status": "Active",
                            },
                        },
                    ],
                    "links": [
                        {
                            "source": "p1",
                            "target": "soc1",
                            "label": "OWNS_PROFILE",
                            "confidence": 1.0,
                        },
                        {
                            "source": "p1",
                            "target": "soc2",
                            "label": "OWNS_PROFILE",
                            "confidence": 0.96,
                        },
                        {
                            "source": "p1",
                            "target": "soc3",
                            "label": "OWNS_PROFILE",
                            "confidence": 0.88,
                        },
                        {
                            "source": "media1",
                            "target": "c1",
                            "label": "ALLEGES_COLLUSION",
                            "confidence": 0.61,
                        },
                        {
                            "source": "media1",
                            "target": "p1",
                            "label": "MENTIONS",
                            "confidence": 0.72,
                        },
                        {
                            "source": "media1",
                            "target": "p3",
                            "label": "MENTIONS",
                            "confidence": 0.68,
                        },
                        {
                            "source": "media2",
                            "target": "case1",
                            "label": "REPORTS_ON",
                            "confidence": 0.95,
                        },
                        {
                            "source": "media3",
                            "target": "p1",
                            "label": "FEATURES",
                            "confidence": 1.0,
                        },
                        {
                            "source": "media4",
                            "target": "c7",
                            "label": "INVESTIGATES",
                            "confidence": 0.79,
                        },
                        {
                            "source": "media4",
                            "target": "c8",
                            "label": "MENTIONS",
                            "confidence": 0.74,
                        },
                        {
                            "source": "c7",
                            "target": "c8",
                            "label": "TRANSFERS_FUNDS_TO",
                            "confidence": 0.55,
                            "properties": {
                                "source": "PressOne leaked documents",
                                "amount_eur": "~1.2M",
                            },
                        },
                    ],
                },
                "progress": 83,
            },
        )

        await asyncio.sleep(2)

        await manager.send_update(
            websocket,
            {
                "type": "DATA_DISCOVERY",
                "scan_id": scan_id,
                "target": target_name,
                "source": "integritate.eu / ONRC / e-licitatie.ro",
                "data": {
                    "nodes": [
                        {
                            "id": "p2",
                            "type": "Person",
                            "label": "Andreea Pop",
                            "summary": "Commercial lawyer. Legal representative for InfraBuild and GreenRoute Construct. Partner at Pop & Asociații.",
                            "url": "N/A",
                            "properties": {
                                "bar_registration": "UNBR-2008-04512",
                                "law_firm": "Pop & Asociații SCA",
                            },
                        },
                        {
                            "id": "p9",
                            "type": "Person",
                            "label": "Florin Neagu",
                            "summary": "Accountant. Signatory on InfraBuild annual financial statements 2019–2023. Also listed as administrator of GreenRoute.",
                            "url": "N/A",
                        },
                        {
                            "id": "p10",
                            "type": "Person",
                            "label": "Ioana Marinescu",
                            "summary": "Wife of Radu Ionescu. Declared income from VoltTech Energy SRL dividends in ANI declarations 2021–2023.",
                            "url": "N/A",
                            "properties": {
                                "relation": "Spouse of p1",
                                "pep_status": True,
                            },
                        },
                        {
                            "id": "p11",
                            "type": "Person",
                            "label": "Alexandru Ionescu",
                            "summary": "Son of Radu Ionescu. Named as shareholder (15%) in Orizont Holding SA since 2021.",
                            "url": "N/A",
                            "properties": {
                                "relation": "Son of p1",
                                "dob": "1999-11-22",
                            },
                        },
                        {
                            "id": "doc1",
                            "type": "Document",
                            "label": "Audit Report 2024 — InfraBuild",
                            "summary": "Court-ordered audit. Highlights subcontracting discrepancies: €4.1M paid to GreenRoute without corresponding deliverables.",
                            "url": "https://example.com/audit-infrabuild-2024.pdf",
                            "properties": {
                                "issued_by": "Curtea de Conturi",
                                "date": "2024-05-30",
                                "pages": 112,
                            },
                        },
                        {
                            "id": "doc2",
                            "type": "Document",
                            "label": "ANI Declaration — Radu Ionescu 2023",
                            "summary": "Asset declaration filed with ANI. Declared: 3 properties in București, 1 in Predeal, 2 vehicles, shareholding in InfraBuild and VoltTech.",
                            "url": "https://declaratii.integritate.eu/radu-ionescu-2023",
                            "properties": {
                                "filed": "2023-06-15",
                                "authority": "ANI",
                            },
                        },
                        {
                            "id": "doc3",
                            "type": "Document",
                            "label": "ONRC Extract — Orizont Holding SA",
                            "summary": "Official company extract. Lists shareholders: Radu Ionescu (60%), Alexandru Ionescu (15%), Meridian Invest Ltd (25%).",
                            "url": "https://recom.onrc.ro/orizont-holding/extract",
                            "properties": {
                                "date": "2024-11-01",
                            },
                        },
                        {
                            "id": "doc4",
                            "type": "Document",
                            "label": "e-Licitatie Contract Award Notice — A8 2024",
                            "summary": "Official award notice. Single valid offer submitted by InfraBuild Solutions SRL. Evaluation committee chaired by Victor Dumitrescu.",
                            "url": "https://e-licitatie.ro/tender/A8-2024/award-notice",
                            "properties": {
                                "published": "2024-07-22",
                                "value_eur": 48000000,
                                "bidders_evaluated": 1,
                            },
                        },
                        {
                            "id": "loc1",
                            "type": "Location",
                            "label": "București — Str. Academiei 14",
                            "summary": "Registered address shared by InfraBuild Solutions SRL and VoltTech Energy SRL until 2022. Currently seat of Pop & Asociații SCA.",
                            "url": "N/A",
                            "properties": {
                                "city": "București",
                                "county": "Ilfov",
                                "companies_registered": [
                                    "c1",
                                    "c6",
                                    "Pop & Asociații SCA",
                                ],
                            },
                        },
                        {
                            "id": "loc2",
                            "type": "Location",
                            "label": "Predeal — Vila Brazi",
                            "summary": "Holiday property declared by Radu Ionescu in ANI 2023. Estimated value: €320,000.",
                            "url": "N/A",
                            "properties": {
                                "city": "Predeal",
                                "county": "Brașov",
                                "declared_value_eur": 320000,
                            },
                        },
                        {
                            "id": "loc3",
                            "type": "Location",
                            "label": "Iași — CNAIR Regional Office",
                            "summary": "Office where Victor Dumitrescu is based. Managed tenders for Moldova region infrastructure.",
                            "url": "https://www.cnair.ro/contact/iasi",
                            "properties": {
                                "city": "Iași",
                                "county": "Iași",
                            },
                        },
                    ],
                    "links": [],
                },
                "progress": 89,
            },
        )

        await asyncio.sleep(4)
        await manager.send_update(
            websocket,
            {
                "type": "SCAN_COMPLETE",
                "scan_id": scan_id,
                "target": target_name,
                "source": "vedem",
                "data": {
                    "links": [
                        {
                            "source": "p2",
                            "target": "c1",
                            "label": "LEGAL_REPRESENTATIVE",
                            "confidence": 0.87,
                            "properties": {"since": "2015"},
                        },
                        {
                            "source": "p2",
                            "target": "c5",
                            "label": "LEGAL_REPRESENTATIVE",
                            "confidence": 0.84,
                        },
                        {
                            "source": "p9",
                            "target": "c1",
                            "label": "ACCOUNTANT",
                            "confidence": 0.93,
                            "properties": {"years": "2019–2023"},
                        },
                        {
                            "source": "p9",
                            "target": "c5",
                            "label": "ADMINISTRATOR",
                            "confidence": 0.88,
                        },
                        {
                            "source": "p10",
                            "target": "c6",
                            "label": "DIVIDEND_RECIPIENT",
                            "confidence": 0.91,
                            "properties": {
                                "source": "ANI declaration",
                                "years": "2021–2023",
                            },
                        },
                        {
                            "source": "p10",
                            "target": "p1",
                            "label": "SPOUSE_OF",
                            "confidence": 1.0,
                        },
                        {
                            "source": "p11",
                            "target": "c7",
                            "label": "SHAREHOLDER",
                            "confidence": 0.95,
                            "properties": {"ownership_pct": "15%", "since": "2021"},
                        },
                        {
                            "source": "p11",
                            "target": "p1",
                            "label": "SON_OF",
                            "confidence": 1.0,
                        },
                        {
                            "source": "c8",
                            "target": "c7",
                            "label": "SHAREHOLDER",
                            "confidence": 0.79,
                            "properties": {
                                "ownership_pct": "25%",
                                "source": "ONRC extract doc3",
                            },
                        },
                        {
                            "source": "c1",
                            "target": "doc1",
                            "label": "SUBJECT_OF_AUDIT",
                            "confidence": 0.90,
                        },
                        {
                            "source": "c1",
                            "target": "loc1",
                            "label": "REGISTERED_AT",
                            "confidence": 1.0,
                            "properties": {"until": "2022"},
                        },
                        {
                            "source": "c6",
                            "target": "loc1",
                            "label": "REGISTERED_AT",
                            "confidence": 1.0,
                            "properties": {"until": "2022"},
                        },
                        {
                            "source": "p1",
                            "target": "doc2",
                            "label": "FILED",
                            "confidence": 1.0,
                        },
                        {
                            "source": "p1",
                            "target": "loc2",
                            "label": "OWNS_PROPERTY",
                            "confidence": 0.97,
                            "properties": {"source": "ANI declaration 2023"},
                        },
                        {
                            "source": "doc3",
                            "target": "c7",
                            "label": "DESCRIBES",
                            "confidence": 1.0,
                        },
                        {
                            "source": "doc4",
                            "target": "event1",
                            "label": "FORMALIZES",
                            "confidence": 1.0,
                        },
                        {
                            "source": "p3",
                            "target": "loc3",
                            "label": "BASED_AT",
                            "confidence": 0.98,
                        },
                        {
                            "source": "p3",
                            "target": "doc4",
                            "label": "SIGNED",
                            "confidence": 0.88,
                            "properties": {"role": "Committee chair"},
                        },
                        {
                            "source": "p1",
                            "target": "p3",
                            "label": "UNOFFICIAL_CONTACT",
                            "confidence": 0.41,
                            "properties": {
                                "source": "Social media co-attendance, Recorder.ro allegation"
                            },
                        },
                        {
                            "source": "p6",
                            "target": "event1",
                            "label": "LOBBIED_FOR",
                            "confidence": 0.48,
                            "properties": {"source": "Recorder.ro allegation"},
                        },
                        {
                            "source": "p7",
                            "target": "p3",
                            "label": "COORDINATED_WITH",
                            "confidence": 0.44,
                            "properties": {
                                "source": "Internal email referenced in case1 file"
                            },
                        },
                        {
                            "source": "c5",
                            "target": "doc1",
                            "label": "MENTIONED_IN_AUDIT",
                            "confidence": 0.92,
                        },
                    ],
                },
                "message": "Scan finished",
                "progress": 100,
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
