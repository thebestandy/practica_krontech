# SEAP/SICAP Public Procurement Scraper

import requests
import json
import time
import re
import os
import hashlib
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, date, timedelta
import csv
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Contract:
    contract_id: str
    title: str
    contracting_authority: str
    supplier: str
    contract_value: float
    currency: str
    contract_date: str
    procedure_type: str
    cpv_code: str
    status: str
    description: str
    source_url: str

@dataclass
class CompanyInfo:
    cui: str
    name: str
    address: str
    total_contracts: int
    total_value: float
    first_contract_date: str
    last_contract_date: str

class ElicitatieScraper:
    BASE_URL = "http://e-licitatie.ro"
    API_BASE = "http://e-licitatie.ro/api-pub"
    SICAP_AI_BASE = "https://api.sicap.ai/v1"

    def __init__(self, delay: float = 2.0):
        self.delay = delay
        self.sicap_api_key = os.getenv("SICAP_API_KEY", "").strip()

        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ro-RO,ro;q=0.9',
        })

        if self.sicap_api_key:
            print(f"API key loaded ({self.sicap_api_key[:8]}...)")
        else:
            print("No API key — will use e-licitatie.ro directly")

    def _get(self, url: str, params: Dict = None, use_key: bool = False) -> requests.Response:
        time.sleep(self.delay)
        headers = {}
        if use_key and self.sicap_api_key:
            headers["Authorization"] = f"Bearer {self.sicap_api_key}"
        response = self.session.get(url, params = params, headers = headers, timeout = 30)
        response.raise_for_status()
        return response

    def _post(self, url: str, body: Dict) -> requests.Response:
        time.sleep(self.delay)
        response = self.session.post(url, json = body, timeout = 30)
        response.raise_for_status()
        return response

    def check_cui_exists(self, cif: str) -> bool:
        if not self.sicap_api_key:
            print("No API key available")
            return False
        try:
            url = f"{self.SICAP_AI_BASE}/cui/{cif}/exists"
            response = self._get(url, use_key = True)
            data = response.json()
            print(f"CUI check response: {data}")
            return data.get("exists", False)
        except Exception as e:
            print(f"check_cui_exists failed: {e}")
            return False

    def get_ac_contracts(self, cif: str) -> List[Contract]:
        if not self.sicap_api_key:
            print("No API key — skipping sicap.ai")
            return []

        url = f"{self.SICAP_AI_BASE}/ac/{cif}/contracts"
        contracts = []
        try:
            response = self._get(url, use_key = True)
            data = response.json()
            print(f"ac/contracts raw response keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")

            items = data if isinstance(data, list) else data.get("items", data.get("data", data.get("contracts", [])))

            for item in items:
                c = self._parse_sicap_ai_contract(item)
                if c:
                    contracts.append(c)

        except Exception as e:
            print(f"get_ac_contracts failed: {e}")

        return contracts

    def get_ac_contracts_latest(self, cif: str) -> List[Contract]:
        if not self.sicap_api_key:
            return []

        url = f"{self.SICAP_AI_BASE}/ac/{cif}/contracts/latest"
        contracts = []
        try:
            response = self._get(url, use_key = True)
            data = response.json()
            print(f"ac/contracts/latest raw response keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")

            items = data if isinstance(data, list) else data.get("items", data.get("data", data.get("contracts", [])))

            for item in items:
                c = self._parse_sicap_ai_contract(item)
                if c:
                    contracts.append(c)

        except Exception as e:
            print(f"get_ac_contracts_latest failed: {e}")

        return contracts

    def get_contracts_by_date(self, target_date: str) -> List[Contract]:
        if not self.sicap_api_key:
            return []

        url = f"{self.SICAP_AI_BASE}/contracts/daily/{target_date}"
        contracts = []
        try:
            response = self._get(url, use_key = True)
            data = response.json()
            print(f"daily/{target_date} response keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")

            items = data if isinstance(data, list) else data.get("items", data.get("data", []))

            for item in items:
                c = self._parse_sicap_ai_contract(item)
                if c:
                    contracts.append(c)

        except Exception as e:
            print(f"get_contracts_by_date failed: {e}")

        return contracts

    def get_contract_by_id(self, source: str, contract_id: str) -> Optional[Contract]:
        if not self.sicap_api_key:
            return None

        url = f"{self.SICAP_AI_BASE}/contracts/{source}/{contract_id}"
        try:
            response = self._get(url, use_key = True)
            data = response.json()
            return self._parse_sicap_ai_contract(data)
        except Exception as e:
            print(f"get_contract_by_id failed: {e}")
            return None

    def _parse_sicap_ai_contract(self, item: Dict) -> Optional[Contract]:
        if not item or not isinstance(item, dict):
            return None
        try:
            return Contract(
                contract_id = str(item.get("id", item.get("contractId", ""))),
                title = item.get("name", item.get("title", item.get("contractTitle", ""))),
                contracting_authority = item.get("contractingAuthority", item.get("authority", item.get("caName", ""))),
                supplier = item.get("supplier", item.get("winner", item.get("supplierName", ""))),
                contract_value = self._parse_value(str(item.get("value", item.get("closingValue", item.get("amount", 0))))),
                currency = item.get("currency", "RON"),
                contract_date = item.get("date", item.get("contractDate", item.get("publicationDate", ""))),
                procedure_type = item.get("procedureType", item.get("type", "")),
                cpv_code = item.get("cpvCode", item.get("cpv", "")),
                status = item.get("status", ""),
                description = item.get("description", ""),
                source_url = item.get("url", item.get("sourceUrl", ""))
            )
        except Exception as e:
            print(f"Error parsing sicap.ai contract: {e}")
            return None

    def search_elicitatie_by_cui(self, cui: str, date_start: str = "2022-01-01") -> List[Contract]:
        print(f"Searching e-licitatie.ro for CUI: {cui} (from {date_start})")
        url = f"{self.API_BASE}/DirectAcquisitionCommon/GetDirectAcquisitionList/"

        body = {
            "pageSize": 100,
            "pageIndex": 0,
            "showOngoingDa": False,
            "cookieContext": None,
            "sysDirectAcquisitionStateId": None,
            "publicationDateStart": None,
            "publicationDateEnd": None,
            "finalizationDateStart": date_start,
            "finalizationDateEnd": datetime.now().strftime("%Y-%m-%d"),
        }

        contracts = []
        page = 0

        while True:
            body["pageIndex"] = page
            try:
                response = self._post(url, body)
                data = response.json()
            except Exception as e:
                print(f"e-licitatie.ro error page {page}: {e}")
                break

            items = data.get("items", [])
            if not items:
                break

            matched = 0
            for item in items:
                supplier_cui = str(item.get("supplierId", "") or item.get("winnerFiscalNumber", ""))
                authority_cui = str(item.get("contractingAuthorityId", "") or item.get("cAFiscalNumber", ""))

                if cui in supplier_cui or cui in authority_cui:
                    contract = self._parse_direct_acquisition(item)
                    if contract:
                        contracts.append(contract)
                        matched += 1

            total = data.get("total", 0)
            fetched = (page + 1) * body["pageSize"]
            print(f"  Page {page}: {len(items)} items scanned, {matched} matched (total available: {total})")

            if fetched >= total or len(items) < body["pageSize"]:
                break
            page += 1

        return contracts

    def _parse_direct_acquisition(self, item: Dict) -> Optional[Contract]:
        try:
            return Contract(
                contract_id = str(item.get("directAcquisitionId", item.get("id", ""))),
                title = item.get("directAcquisitionName", item.get("name", "")),
                contracting_authority = item.get("contractingAuthorityName", ""),
                supplier = item.get("supplierName", item.get("winnerName", "")),
                contract_value = self._parse_value(str(item.get("closingValue", item.get("totalAmount", 0)))),
                currency = item.get("currency", "RON"),
                contract_date = item.get("finalizationDate", item.get("publicationDate", "")),
                procedure_type = "Achizitie directa",
                cpv_code = item.get("cpvCode", item.get("cpvCodeAndName", "")),
                status = item.get("sysDirectAcquisitionState", {}).get("text", "") if isinstance(item.get("sysDirectAcquisitionState"), dict) else "",
                description = item.get("description", ""),
                source_url = f"{self.BASE_URL}/pub/direct-acquisition/view/{item.get('directAcquisitionId', '')}"
            )
        except Exception as e:
            print(f"Error parsing contract: {e}")
            return None

    def _resolve_cui(self, target: str) -> Optional[str]:
        cui_curat = target.upper().replace('RO', '').strip()
        if cui_curat.isdigit():
            return cui_curat

        print(f"[SEAP] Target non-numeric, caut CUI dupa nume: {target}")
        try:
            r = self.session.get(
                f"https://demoanaf.ro/api/search?q={target}",
                timeout = 15,
            )
            r.raise_for_status()
            rezultate = r.json()
            firme = rezultate.get("data", rezultate)
            if isinstance(firme, list) and firme:
                cui = str(firme[0].get("cui", firme[0].get("CUI", "")))
                if cui:
                    print(f"[SEAP] Gasit CUI {cui} pentru \"{target}\"")
                    return cui
        except Exception as e:
            print(f"[SEAP] Rezolvare CUI dupa nume esuata: {e}")

        print(f"[SEAP] Nu s-a gasit niciun CUI pentru \"{target}\"")
        return None

    def search_by_cui(self, cui: str, date_start: str = "2022-01-01") -> List[Contract]:
        contracts = []

        if self.sicap_api_key:
            print(f"\n[1/3] Checking CUI {cui} on sicap.ai...")
            exists = self.check_cui_exists(cui)
            print(f"CUI exists: {exists}")

            print(f"\n[2/3] Getting contracts where {cui} is contracting authority...")
            ac_contracts = self.get_ac_contracts(cui)
            print(f"Found {len(ac_contracts)} contracts as authority")
            contracts.extend(ac_contracts)

            if not contracts:
                print(f"\nNote: /ac/ endpoints cauta firma ca AUTORITATE CONTRACTANTA.")
                print(f"Daca firma e FURNIZOR, /v1/supplier/:cif/contracts e Enterprise (2000 credite).")

        print(f"\n[3/3] Searching e-licitatie.ro directly (free, no key needed)...")
        elicitatie_contracts = self.search_elicitatie_by_cui(cui, date_start = date_start)
        print(f"Found {len(elicitatie_contracts)} contracts on e-licitatie.ro")

        seen_ids = {c.contract_id for c in contracts}
        for c in elicitatie_contracts:
            if c.contract_id not in seen_ids:
                contracts.append(c)
                seen_ids.add(c.contract_id)

        return contracts

    def get_company_summary(self, cui: str) -> CompanyInfo:
        contracts = self.search_by_cui(cui)
        if not contracts:
            return CompanyInfo(cui = cui, name = '', address = '',
                               total_contracts = 0, total_value = 0.0,
                               first_contract_date = '', last_contract_date = '')

        total_value = sum(c.contract_value for c in contracts)
        dates = sorted([c.contract_date for c in contracts if c.contract_date])
        name = next((c.supplier or c.contracting_authority for c in contracts), '')

        return CompanyInfo(
            cui = cui, name = name, address = '',
            total_contracts = len(contracts),
            total_value = total_value,
            first_contract_date = dates[0] if dates else '',
            last_contract_date = dates[-1] if dates else ''
        )

    def _parse_value(self, value_str: str) -> float:
        cleaned = re.sub(r'[^\d.,]', '', str(value_str))
        cleaned = cleaned.replace('.', '').replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def search(self, target: str, date_start: str = "2022-01-01"):
        cui = self._resolve_cui(target)

        if not cui:
            return {
                "source": "seap scraper",
                "type": "document",
                "certainty": "0",
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "source": "SEAP / e-licitatie.ro",
                    "count": 0,
                },
                "nodes": [],
            }

        contracts = self.search_by_cui(cui, date_start = date_start)

        graph_nodes = []
        seen_suppliers = set()

        for contract in contracts:
            supplier_key = contract.supplier or "unknown"
            if supplier_key not in seen_suppliers:
                seen_suppliers.add(supplier_key)
                supplier_id = hashlib.md5(
                    f"{supplier_key}_{contract.contracting_authority}".encode()
                ).hexdigest()

                graph_nodes.append({
                    "id": f"person_{supplier_id}",
                    "type": "Person",
                    "label": supplier_key,
                    "summary": f"Furnizor la {contract.contracting_authority}" if contract.contracting_authority else "Furnizor",
                    "url": "N/A",
                })

            graph_nodes.append({
                "id": f"contract_{contract.contract_id}",
                "type": "Document",
                "label": contract.title or f"Contract {contract.contract_id}",
                "summary": f"{contract.procedure_type} • {contract.contract_value:,.2f} {contract.currency} • {contract.contract_date}",
                "url": contract.source_url,
            })

        return {
            "source": "seap scraper",
            "type": "document",
            "certainty": "0",
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": "SEAP / e-licitatie.ro",
                "count": len(graph_nodes),
            },
            "nodes": graph_nodes,
        }

# le-am lasat comentate
# def main():
#     scraper = ElicitatieScraper(delay = 2.0)
#
#     print("\n=== Cautare dupa CUI ===")
#     cui = input("Enter company CUI (or press Enter to skip): ").strip()
#     if cui:
#         contracts = scraper.search_by_cui(cui, date_start = "2022-01-01")
#
#         print(f"\n{'='*50}")
#         print(f"TOTAL FOUND: {len(contracts)} contracts for CUI {cui}")
#         print(f"{'='*50}")
#
#         for c in contracts[:5]:
#             print(f"\n- {c.title}")
#             print(f"Autoritate: {c.contracting_authority}")
#             print(f"Furnizor: {c.supplier}")
#             print(f"Valoare: {c.contract_value} {c.currency}")
#             print(f"Data: {c.contract_date}")
#             print(f"Link: {c.source_url}")
#
#         if contracts:
#             timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#             scraper.export_to_csv(contracts, f"contracts_{cui}_{timestamp}.csv")
#             scraper.export_to_json(contracts, f"contracts_{cui}_{timestamp}.json")
#
#         print("\n=== Sumar companie ===")
#         summary = scraper.get_company_summary(cui)
#         print(f"Companie: {summary.name}")
#         print(f"Total contracte: {summary.total_contracts}")
#         print(f"Valoare totala: {summary.total_value:,.2f} RON")
#         print(f"Primul contract: {summary.first_contract_date}")
#         print(f"Ultimul contract: {summary.last_contract_date}")
#
# if __name__ == "__main__":
#     main()