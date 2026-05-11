# ANAF Scraper

import requests
import json
import hashlib
import urllib3
from datetime import date, datetime
from time import sleep
from typing import Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

class AnafScraper:

    ANAF_URL = 'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva'
    DEMO_BASE = 'https://demoanaf.ro/api'

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _get_anaf_data(self, cui: str) -> dict:
        cui_curat = cui.upper().replace('RO', '').strip()
        payload = [{'cui': int(cui_curat), 'data': str(date.today())}]
        try:
            r = self.session.post(
                self.ANAF_URL,
                json = payload,
                headers = {**HEADERS, 'Content-Type': 'application/json'},
                timeout = 15,
                verify = False,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f'Eroare: {e}')
            return {}

    def _get_cu_retry(self, url: str, incercari: int = 3, timeout: int = 30) -> dict:
        for i in range(incercari):
            try:
                r = self.session.get(url, timeout=timeout)
                r.raise_for_status()
                return r.json()
            except requests.exceptions.Timeout:
                print(f'Timeout - incerc din nou ({i+1}/{incercari})...')
                sleep(2)
            except Exception as e:
                print(f'Eroare: {e}')
                break
        return {}

    def _get_company(self, cui: str) -> dict:
        return self._get_cu_retry(f'{self.DEMO_BASE}/company/{cui}')

    def _get_financials(self, cui: str) -> dict:
        return self._get_cu_retry(f'{self.DEMO_BASE}/company/{cui}/financials', timeout = 45)

    def _search_company(self, q: str) -> dict:
        return self._get_cu_retry(f'{self.DEMO_BASE}/search?q={q}')

    def _resolve_cui(self, target: str) -> Optional[str]:
        cui_curat = target.upper().replace('RO', '').strip()

        if cui_curat.isdigit():
            return cui_curat

        print(f'Target non-numeric, caut dupa nume: {target}')
        rezultate = self._search_company(target)

        firme = rezultate.get('data', rezultate)
        if isinstance(firme, list) and firme:
            cui = str(firme[0].get('cui', firme[0].get('CUI', '')))
            if cui:
                print(f'Gasit CUI {cui} pentru "{target}"')
                return cui

        print(f'Nu s-a gasit niciun CUI pentru "{target}"')
        return None

    def _build_nodes(self, cui: str, anaf_data: dict, company_data: dict, financials: dict) -> list:
        nodes = []

        firma = anaf_data.get('found', [{}])[0] if anaf_data.get('found') else {}
        dg = firma.get('date_generale', {})
        adresa = firma.get('adresa_sediu_social', {})
        tva = firma.get('inregistrare_scop_Tva', {})
        inactiv = firma.get('stare_inactiv', {})

        denumire = dg.get('denumire', '')
        stare = dg.get('stare_inregistrare', '')

        person_id = hashlib.md5(f'{cui}_{denumire}'.encode()).hexdigest()

        judet = adresa.get('sdenumire_Judet', '')
        localitate = adresa.get('sdenumire_Localitate', '')
        adresa_str = f'{judet}, {localitate}' if judet or localitate else 'N/A'

        nodes.append({
            'id': f'person_{person_id}',
            'type': 'Person',
            'label': denumire or f'CUI {cui}',
            'summary': f'{stare} - {adresa_str}',
            'url': f'https://www.anaf.ro/anaf/internet/RO/cautare-dupa-cui?cui={cui}',
            'properties': {
                'cui': cui,
                'nr_reg_com': dg.get('nrRegCom', ''),
                'cod_caen': dg.get('cod_CAEN', ''),
                'forma_juridica': dg.get('forma_juridica', ''),
                'forma_proprietate': dg.get('forma_de_proprietate', ''),
                'stare': stare,
                'telefon': dg.get('telefon', ''),
                'organ_fiscal': dg.get('organFiscalCompetent', ''),
                'platitor_tva': tva.get('scpTVA', False),
                'inactiv': inactiv.get('statusInactivi', False),
            },
        })

        data = company_data.get('data', {})
        admini = data.get('administrators', [])
        for admin in admini:
            admin_name = admin.get('name', '')
            admin_role = admin.get('role', '')
            if not admin_name:
                continue
            admin_id = hashlib.md5(f'{admin_name}_{cui}'.encode()).hexdigest()
            nodes.append({
                'id': f'person_{admin_id}',
                'type': 'Person',
                'label': admin_name,
                'summary': f'{admin_role} la {denumire or cui}',
                'url': 'N/A',
                'properties': {
                    'role': admin_role,
                    'company_cui': cui,
                },
            })

        fin_data = financials.get('data', [])
        for an_fin in fin_data:
            an = an_fin.get('year', '?')
            caen = an_fin.get('caenDescription', '')
            eur = an_fin.get('eurRate', 1) or 1

            ind_map = {i['code']: i['value'] for i in an_fin.get('indicators', [])}

            cifra_afaceri = ind_map.get('I13', 0)
            profit_net = ind_map.get('I18', 0)
            pierdere_neta = ind_map.get('I19', 0)
            angajati = ind_map.get('I20', 0)

            rezultat_net = profit_net if profit_net else -pierdere_neta

            fin_id = hashlib.md5(f'{cui}_{an}'.encode()).hexdigest()
            nodes.append({
                'id': f'doc_{fin_id}',
                'type': 'Document',
                'label': f'Situatie financiara {an} - {denumire or cui}',
                'summary': (
                    f'CA: {int(cifra_afaceri):,} RON'
                    f'Rezultat net: {int(rezultat_net):,} RON'
                    f'Angajati: {int(angajati)}'
                ),
                'url': f'https://mfinante.gov.ro/ro/web/efin/rezultate-bilant?cui={cui}',
                'properties': {
                    'year': an,
                    'caen': caen,
                    'cifra_afaceri_ron': cifra_afaceri,
                    'cifra_afaceri_eur': int(cifra_afaceri / eur),
                    'profit_net_ron': profit_net,
                    'pierdere_neta_ron': pierdere_neta,
                    'total_venituri': ind_map.get('I14', 0),
                    'total_cheltuieli': ind_map.get('I15', 0),
                    'total_datorii': ind_map.get('I7', 0),
                    'capital_social': ind_map.get('I11', 0),
                    'angajati': angajati,
                },
            })

        return nodes

    def search(self, target: str) -> dict:
        print(f'[ANAF] Search: {target}')

        cui = self._resolve_cui(target)
        if not cui:
            return {
                'source': 'anaf scraper',
                'type': 'document',
                'certainty': '0',
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'source': 'ANAF',
                    'count': 0,
                },
                'nodes': [],
            }

        anaf_data = self._get_anaf_data(cui)
        company_data = self._get_company(cui)
        financials = self._get_financials(cui)

        nodes = self._build_nodes(cui, anaf_data, company_data, financials)

        return {
            'source': 'anaf scraper',
            'type': 'document',
            'certainty': '0',
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'source': 'ANAF / demoanaf.ro',
                'count': len(nodes),
            },
            'nodes': nodes,
        }
    
# le-am lasat comentate
# def export_to_json(results: List[PersonResult], filename: str):
#     output = {
#         "metadata": {
#             "timestamp": datetime.now().isoformat(),
#             "source": "ANAF / demoanaf.ro",
#             "count": len(results)
#         },
#         "data": [r.to_dict() for r in results]
#     }
#     with open(filename, "w", encoding="utf-8") as f:
#         json.dump(output, f, ensure_ascii = False, indent = 4)
#     log.info(f"JSON exported to {filename}")
#
# if __name__ == "__main__":
#     search_name = input("Enter name to search: ").strip()
#     if search_name:
#         scraper = AnafScraper()
#         data = scraper.search(search_name)
#
#         if data:
#             export_to_json(data, f"ani_{search_name.replace(' ', '_')}.json")
#         else:
#             print("No results found.")