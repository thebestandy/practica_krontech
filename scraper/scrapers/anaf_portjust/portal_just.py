# Portal Just Scraper

import hashlib
import requests
import xml.etree.ElementTree as ET
import urllib3
from datetime import datetime
from typing import Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SOAP_URL = 'http://portalquery.just.ro/query.asmx'
HEADERS = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'portalquery.just.ro/CautareDosare',
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'text/xml',
}
NS = 'portalquery.just.ro'

class PortalJustScraper:

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Mozilla/5.0'})

    def _cauta_dosare(self, nume_parte: str) -> list:
        body = f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CautareDosare xmlns="{NS}">
      <numeParte>{nume_parte}</numeParte>
      <obiectDosar xsi:nil="true"/>
      <numarul xsi:nil="true"/>
      <dataStart xsi:nil="true"/>
      <dataStop xsi:nil="true"/>
    </CautareDosare>
  </soap:Body>
</soap:Envelope>"""

        try:
            r = self.session.post(
                SOAP_URL,
                data = body.encode('utf-8'),
                headers = HEADERS,
                timeout = 30,
                verify = False,
            )
            r.raise_for_status()
            return self._parseaza_raspuns(r.text)
        except Exception as e:
            print(f'[portal.just.ro] Eroare: {e}')
            return []

    def _parseaza_raspuns(self, xml_text: str) -> list:
        dosare = []
        try:
            root = ET.fromstring(xml_text)
            items = root.findall(f'.//{{{NS}}}Dosar')

            for dosar in items:
                def g(tag):
                    el = dosar.find(f'{{{NS}}}{tag}')
                    return el.text.strip() if el is not None and el.text else 'N/A'

                parti = []
                for parte in dosar.findall(f'.//{{{NS}}}DosarParte'):
                    if parte.get('{http://www.w3.org/2001/XMLSchema-instance}nil') == 'true':
                        continue
                    nume_el = parte.find(f'{{{NS}}}nume')
                    cal_el = parte.find(f'{{{NS}}}calitateParte')
                    if nume_el is not None and nume_el.text:
                        parti.append({
                            'nume': nume_el.text.strip(),
                            'calitate': cal_el.text.strip() if cal_el is not None and cal_el.text else 'N/A',
                        })

                sedinte = []
                for sedinta in dosar.findall(f'.//{{{NS}}}DosarSedinta'):
                    if sedinta.get('{http://www.w3.org/2001/XMLSchema-instance}nil') == 'true':
                        continue
                    def gs(tag):
                        el = sedinta.find(f'{{{NS}}}{tag}')
                        return el.text.strip() if el is not None and el.text else 'N/A'
                    sedinte.append({
                        'data': gs('data'),
                        'ora': gs('ora'),
                        'complet': gs('complet'),
                        'solutie': gs('solutie'),
                    })

                data_dosar = 'N/A'
                if sedinte:
                    try:
                        data_dosar = sorted(sedinte, key=lambda s: s['data'])[0]['data']
                    except Exception:
                        pass

                dosare.append({
                    'numar': g('numar'),
                    'data': data_dosar,
                    'status': g('stadiuProcesualNume'),
                    'instanta': g('institutie'),
                    'sectie': g('sectie'),
                    'obiect': g('obiect'),
                    'parti': parti,
                    'sedinte': sedinte,
                })

        except ET.ParseError as e:
            print(f'Eroare: {e}')

        return dosare

    def _filtreaza_relevante(self, dosare: list, target: str) -> list:
        termeni = target.upper().split()
        relevante = []
        for d in dosare:
            for parte in d['parti']:
                if all(t in parte['nume'].upper() for t in termeni):
                    relevante.append(d)
                    break
        return relevante

    def _build_nodes(self, dosare: list, target: str) -> list:
        nodes = []
        seen_parti = {} 
        seen_dosare = set()

        for dosar in dosare:
            numar  = dosar['numar']
            obiect = dosar['obiect']

            for parte in dosar['parti']:
                nume_parte = parte['nume']
                if nume_parte not in seen_parti:
                    parte_id = hashlib.md5(nume_parte.encode()).hexdigest()
                    node_id  = f'person_{parte_id}'
                    seen_parti[nume_parte] = node_id

                    nodes.append({
                        'id': node_id,
                        'type': 'Person',
                        'label': nume_parte,
                        'summary': f'{parte["calitate"]} in dosare judiciare',
                        'url': 'N/A',
                        'properties': {
                            'calitate': parte['calitate'],
                        },
                    })

            if numar not in seen_dosare:
                seen_dosare.add(numar)
                dosar_id = hashlib.md5(numar.encode()).hexdigest()

                ultima_sedinta = 'N/A'
                ultima_solutie = 'N/A'
                if dosar['sedinte']:
                    try:
                        ultima = sorted(dosar['sedinte'], key=lambda s: s['data'])[-1]
                        ultima_sedinta = f'{ultima["data"]} {ultima["ora"]}'.strip()
                        ultima_solutie = ultima['solutie']
                    except Exception:
                        pass

                nodes.append({
                    'id': f'doc_{dosar_id}',
                    'type': 'Document',
                    'label': f'Dosar {numar}',
                    'summary': (
                        f'{obiect} - {dosar["instanta"]}'
                        f' | Status: {dosar["status"]}'
                    ),
                    'url': f'https://portal.just.ro/SitePages/cautare.aspx?num={numar}',
                    'properties': {
                        'numar': numar,
                        'data': dosar['data'],
                        'status': dosar['status'],
                        'instanta': dosar['instanta'],
                        'sectie': dosar['sectie'],
                        'obiect': obiect,
                        'ultima_sedinta': ultima_sedinta,
                        'ultima_solutie': ultima_solutie,
                        'nr_sedinte': len(dosar['sedinte']),
                        'parti': [p['nume'] for p in dosar['parti']],
                    },
                })

        return nodes

    def search(self, target: str) -> dict:
        print(f'Search: {target}')

        dosare_brute   = self._cauta_dosare(target)
        dosare_filtrate = self._filtreaza_relevante(dosare_brute, target)

        print(f'[PortalJust] {len(dosare_brute)} dosare brute, {len(dosare_filtrate)} relevante pentru "{target}"')

        nodes = self._build_nodes(dosare_filtrate, target)

        return {
            'source': 'portal just scraper',
            'type': 'document',
            'certainty': '0',
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'source': 'portal.just.ro',
                'count': len(nodes),
            },
            'nodes': nodes,
        }
    
# le-am lasat comentate
# def export_to_json(results: List[PersonResult], filename: str):
#     output = {
#         "metadata": {
#             "timestamp": datetime.now().isoformat(),
#             "source": "portal.just.ro",
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
#         scraper = PortalJustScraper()
#         data = scraper.search(search_name)
#
#         if data:
#             export_to_json(data, f"ani_{search_name.replace(' ', '_')}.json")
#         else:
#             print("No results found.")