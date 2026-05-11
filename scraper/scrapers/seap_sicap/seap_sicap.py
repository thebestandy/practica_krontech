# SEAP/SICAP Public Procurement Scraper

import requests
import json
import time
import re
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Content-Type": "application/json;charset=UTF-8",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "ro-RO,ro;q=0.9",
        })

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
            return False
        try:
            url = f"{self.SICAP_AI_BASE}/cui/{cif}/exists"
            response = self._get(url, use_key = True)
            data = response.json()
            return data.get("exists", False)
        except Exception as e:
            print(f"check_cui_exists failed: {e}")
            return False

    def get_ac_contracts(self, cif: str) -> List[Contract]:
        if not self.sicap_api_key:
            return []
        url = f"{self.SICAP_AI_BASE}/ac/{cif}/contracts"
        contracts = []
        try:
            response = self._get(url, use_key = True)
            data = response.json()
            items = data if isinstance(data, list) else data.get("items", data.get("data", data.get("contracts", [])))
            for item in items:
                c = self._parse_sicap_ai_contract(item)
                if c:
                    contracts.append(c)
        except Exception as e:
            print(f"get_ac_contracts failed: {e}")
        return contracts

    def search_elicitatie_by_cui(self, cui: str, date_start: str = "2022-01-01") -> List[Contract]:
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

            for item in items:
                supplier_cui = str(item.get("supplierId", "") or item.get("winnerFiscalNumber", ""))
                authority_cui = str(item.get("contractingAuthorityId", "") or item.get("cAFiscalNumber", ""))

                if cui in supplier_cui or cui in authority_cui:
                    contract = self._parse_direct_acquisition(item)
                    if contract:
                        contracts.append(contract)

            total = data.get("total", 0)
            fetched = (page + 1) * body["pageSize"]
            if fetched >= total or len(items) < body["pageSize"]:
                break
            page += 1

        return contracts

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
                source_url = item.get("url", item.get("sourceUrl", "")),
            )
        except Exception as e:
            print(f"Error parsing sicap.ai contract: {e}")
            return None

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
                status = item.get("sysDirectAcquisitionState", {}).get("text", "")
                    if isinstance(item.get("sysDirectAcquisitionState"), dict) else "",
                description = item.get("description", ""),
                source_url = f"{self.BASE_URL}/pub/direct-acquisition/view/{item.get('directAcquisitionId', '')}",
            )
        except Exception as e:
            print(f"Error parsing contract: {e}")
            return None

    def _parse_value(self, value_str: str) -> float:
        cleaned = re.sub(r"[^\d.,]", "", str(value_str))
        cleaned = cleaned.replace(".", "").replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def search(self, target: str, date_start: str = "2022-01-01") -> dict:
        contracts: List[Contract] = []

        if self.sicap_api_key and re.match(r"^\d+$", target.strip()):
            ac_contracts = self.get_ac_contracts(target.strip())
            contracts.extend(ac_contracts)

        elicitatie_contracts = self.search_elicitatie_by_cui(target.strip(), date_start = date_start)

        seen_ids = {c.contract_id for c in contracts}
        for c in elicitatie_contracts:
            if c.contract_id not in seen_ids:
                contracts.append(c)
                seen_ids.add(c.contract_id)

        graph_nodes = []

        seen_suppliers: Dict[str, str] = {} 

        for contract in contracts:
            supplier_key = contract.supplier or "unknown"
            if supplier_key not in seen_suppliers:
                import hashlib
                supplier_id = hashlib.md5(f"{supplier_key}_{contract.contracting_authority}".encode()).hexdigest()
                node_id = f"person_{supplier_id}"
                seen_suppliers[supplier_key] = node_id

                graph_nodes.append({
                    "id": node_id,
                    "type": "Person",
                    "label": supplier_key,
                    "summary": f"Furnizor la {contract.contracting_authority}" if contract.contracting_authority else "Furnizor",
                    "url": "N/A",
                })

            graph_nodes.append({
                "id": f"contract_{contract.contract_id}",
                "type": "Document",
                "label": contract.title or f"Contract {contract.contract_id}",
                "summary": (
                    f"{contract.procedure_type} {contract.contract_value:,.2f} {contract.currency}"
                    f"{contract.contract_date}"
                ),
                "url": contract.source_url,
                "properties": {
                    "contracting_authority": contract.contracting_authority,
                    "supplier": contract.supplier,
                    "value": contract.contract_value,
                    "currency": contract.currency,
                    "date": contract.contract_date,
                    "procedure_type": contract.procedure_type,
                    "cpv_code": contract.cpv_code,
                    "status": contract.status,
                },
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
# def export_to_json(results: List[PersonResult], filename: str):
#     output = {
#         "metadata": {
#             "timestamp": datetime.now().isoformat(),
#             "source": "SEAP / e-licitatie.ro",
#             "count": len(results)
#         },
#         "data": [r.to_dict() for r in results]
#     }
#     with open(filename, "w", encoding = "utf-8") as f:
#         json.dump(output, f, ensure_ascii = False, indent = 4)
#     log.info(f"JSON exported to {filename}")
#
# if __name__ == "__main__":
#     search_name = input("Enter name to search: ").strip()
#     if search_name:
#         scraper = ElicitatieScraper()
#         data = scraper.search(search_name)
#
#         if data:
#             export_to_json(data, f"ani_{search_name.replace(' ', '_')}.json")
#         else:
#             print("No results found.")