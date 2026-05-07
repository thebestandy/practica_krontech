# SEAP/SICAP Public Procurement

import requests 
from bs4 import BeautifulSoup
import json
import time
import re 
from typing import Dict, List, Optional, Union 
from dataclasses import dataclass, asdict
from datetime import datetime
import csv
import os

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
    BASE_URL = "https://www.e-licitatie.ro"
    #nuj, adk nuj ce sa api valid sa pun aici
    API_BASE = "https://www.e-licitatie.ro/api"

    def __init__(self, delay: float = 1.0):
        self.session = requests.Session()
        self.delay = delay
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/547.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ro-RO, ro; q=0.9, en-US; q=0.8, en; q=0.7',
        })
    
    def _make_request(self, url: str, params: Optional[Dict] = None) -> requests.Response:
        time.sleep(self.delay)
        try:
            response = self.session.get(url, params=params, timeout = 30)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def search_by_cui(self, cui: str) -> List[Contract]:
        print(f"Searching for contracts with/by CUI: {cui}")
        return self._search_contracts(cui = cui)
    
    def search_by_name(self, company_name: str) -> List[Contract]:
        print(f"Search for contracts with/by company name: {company_name}")
        return self._search_contracts(company_name = company_name)
    
    def _search_contracts(self, cui: Optional[str] = None, company_name: Optional[str] = None) -> List[Contract]:
        contracts = []

        # verif API daca este valid sau disponibil/posibil
        try:
            contracts = self._search_via_api(cui, company_name)
        except Exception as e:
            print(f"API search failed: {e}, falling back to the web scraping")
            contracts = self._search_via_web(cui, company_name)
        
        return contracts
    
    def _search_via_api(self, cui: Optional[str] = None, company_name: Optional[str] = None) -> List[Contract]:
        contracts = []
        params = {'page': 1, 'size': 100,}

        if cui:
            params['cui'] = cui
        if company_name:
            params['nume'] = company_name

        url = f"{self.API_BASE}/public/contracte"
        response = self._make_request(url, params = params)
        data = response.json()

        if 'items' in data:
            for i in data['items']:
                contract = self._parse_api_contract(i)
                if contract:
                    contracts.append(contract)
        return contracts
    
    def _parse_api_contract(self, item: Dict) -> Optional[Contract]:
        try:
            return Contract(
                contract_id = item.get('id', ''),
                title = item.get('titlu', ''),
                contracting_authority = item.get('autoritateContractata', ''),
                supplier = item.get('furnizor', ''),
                contract_value = self._parse_value(item.get('valoare', '0')),
                currency = item.get('moneda', 'RON'),
                contract_date = item.get('dataContract', ''),
                procedure_type = item.get('tipProcedura', ''),
                cpv_code = item.get('codCpv', ''),
                status = item.get('stare', ''),
                description = item.get('descriere', ''),
                source_url = item.get('url', '')
            )
        except Exception as e:
            print(f"Error parsing contract: {e}")
            return None
    
    def _search_via_web(self, cui: Optional[str] = None, company_name: Optional[str] = None) -> List[Contract]:
        contracts = []

        # rulare cautare URL
        # lafel ca mai sus nuj daca e bine
        search_url = f"{self.BASE_URL}/pub/notificari-cautare"
        params = {}

        if cui:
            params['cui'] = cui
        if company_name:
            params['nume'] = company_name
        
        try:
            response = self._make_request(search_url, params = params)
            soup = BeautifulSoup(response.text, 'html.parser')

            # parsez/procesez/analizez contract listings
            contract_rows = soup.find_all('tr', class_ = 'contract-row')
            for i in contract_rows:
                contract = self._parse_web_contract(i)
                if contract:
                    contracts.append(contract)
        except Exception as e:
            print(f"Web scraping failed: {e}")
        return contracts
    
    # <div> <tr> <td> ... </td> </tr> </div> -> doar k idee

    def _parse_web_contract(self, row) -> Optional[Contract]:
        try:
            cells = row.find_all('td')
            if len(cells) < 5:
                return None
            return Contract(
                contract_id = cells[0].get_text(strip = True),
                title = cells[1].get_text(strip = True),
                contracting_authority = cells[2].get_text(strip = True),
                supplier = cells[3].get_text(strip = True),
                contract_value = self._parse_value(cells[4].get_text(strip = True)),
                currency = 'RON',
                contract_date = cells[5].get_text(strip = True) if len(cells) > 5 else '', # conditie ? 1:0 (ca in c# sau java)
                procedure_type = '',
                cpv_code= '',
                status = '',
                description = '',
                source_url = self.BASE_URL + row.find('a')['href'] if row.find('a') else ''
            )
        except Exception as e:
            print(f"Error parsing web contract: {e}")
            return None
    
    def get_contract_details(self, contract_id: str) -> Dict:
        details_url = f"{self.API_BASE}/public/contracte/{contract_id}"

        try:
            response = self._make_request(details_url)
            return response.json()
        except Exception as e:
            print(f"Failed to get contract details: {e}")
            return {}
    
    def get_company_summary(self, cui: str) -> CompanyInfo:
        contracts = self.search_by_cui(cui)

        if not contracts:
            return CompanyInfo(
                cui = cui,
                name = '',
                address = '',
                total_contracts = 0,
                total_value = 0.0,
                first_contract_date = '',
                last_contract_date = ''
            )
        
        total_value = 0
        for c in contracts:
            total_value += c.contract_value
        dates = []
        for c in contracts:
            if c.contract_date:
                dates.append(c.contract_date)
        dates.sort()

        return CompanyInfo(
            cui = cui, 
            name = contracts[0].supplier if contracts else '',
            address = '',
            total_contracts = len(contracts),
            total_value = total_value,
            first_contract_date = dates[0] if dates else '',
            last_contract_date = dates[-1] if dates else ''
        )
    
    def _parse_value(self, value_str: str) -> float:
        # elimin spatii si convertesc la/spre float
        # sterg . si ,
        # [] = set de caractere
        # ^ = in interior
        # \d = orice cifra de la 0 la 9
        cleaned = re.sub(r'[^\d.,]', '', value_str)
        cleaned = cleaned.replace('.', '').replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def export_to_csv(self, contracts: List[Contract], filename: str):
        if not contracts:
            print("No contracts to export")
            return

        with open(filename, 'w', newline = '', encoding = 'utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Contract ID', 'Title', 'Contracting Authority', 'Supplier', 'Value', 'Currency',
                'Date', 'Procedure Type', 'CPV Code', 'Status', 'Description', 'Source URL'
            ])

            for c in contracts:
                writer.writerow([
                    c.contract_id,
                    c.title,
                    c.contracting_authority,
                    c.supplier,
                    c.contract_value,
                    c.currency,
                    c.contract_date,
                    c.procedure_type,
                    c.cpv_code,
                    c.status,
                    c.description,
                    c.source_url
                ])  
        print(f"Exported {len(contracts)} contracs to {filename}")

    def export_to_json(self, contracts: List[Contract], filename: str):
        data = []
        for c in contracts:
            data.append(asdict(c))  #dataclasses

        with open(filename, 'w', encoding = 'utf-8') as f:
            json.dump(data, f, indent = 2, ensure_ascii = False)
        print(f"Exported {len(contracts)} contracts to {filename}")

def main():
    scraper = ElicitatieScraper(delay = 1.5)

    # ex 1: cautare dupa cui
    print("\n=== Search by CUI ===")
    cui = input("Enter company CUI (or press Enter to skip): ").strip()
    if cui:
        contracts = scraper.search_by_cui(cui)
        print(f"\nFound {len(contracts)} contracts")

        for c in contracts[:5]: # primele 5
            print(f"\n- {c.title}")
            print(f"  Value: {c.contract_value} {c.currency}")
            print(f"  Date: {c.contract_date}")

        # exportare rezulate
        if contracts:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            scraper.export_to_csv(contracts, f"contracts_{cui}_{timestamp}.csv")
            scraper.export_to_json(contracts, f"contracts_{cui}_{timestamp}.json")

    # ex 2: cautare dupa numele companiei
    print("\n=== Search by Company Name ===")
    company_name = input("Enter company name (or press Enter to skip): ").strip()
    if company_name:
        contracts = scraper.search_by_name(company_name)
        print(f"\nFound {len(contracts)} contracts")

        for c in contracts[:5]:
            print(f"\n- {c.title}")
            print(f"  Value: {c.contract_value} {c.currency}")
            print(f"  Date: {c.contract_date}") 
        
        # exportare rezultate
        if contracts:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_name = re.sub(r'[^\w]', '_', company_name) # inlocuiesc orice caracter ce nu e litera sau cifra cu underscore 
            scraper.export_to_csv(contracts, f"contracts_{safe_name}_{timestamp}.csv")
            scraper.export_to_json(contracts, f"contracts_{safe_name}_{timestamp}.json")

    # ex 3: rezumat companie
    if cui:
        print("\n=== Company Summary ===")
        summary = scraper.get_company_summary(cui)
        print(f"Company: {summary.name}")
        print(f"Total Contracts: {summary.total_contracts}")
        print(f"Total Value: {summary.total_value} RON")
        print(f"First Contract: {summary.first_contract_date}")
        print(f"Last Contract: {summary.last_contract_date}")

if __name__ == "__main__":
    main()
