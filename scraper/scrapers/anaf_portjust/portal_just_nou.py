# Portal Just Scraper

import requests
import xml.etree.ElementTree as ET
import urllib3
import hashlib
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SOAP_URL = "http://portalquery.just.ro/query.asmx"
HEADERS = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": "portalquery.just.ro/CautareDosare",
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/xml"
}
NS = "portalquery.just.ro"


class PortalJustScraper:

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Mozilla/5.0"})

    def cauta_dosare(self, nume_parte: str = "") -> list:
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
            r = self.session.post(SOAP_URL, data = body.encode("utf-8"), headers = HEADERS, timeout = 30)
            print(f"HTTP status: {r.status_code}")
            r.raise_for_status()
            return self.parseaza_raspuns(r.text)
        except Exception as e:
            print(f"Eroare: {e}")
            return []

    def parseaza_raspuns(self, xml_text: str) -> list:
        dosare = []
        try:
            root = ET.fromstring(xml_text)

            items = root.findall(f".//{{{NS}}}Dosar")

            for dosar in items:
                def g(tag):
                    el = dosar.find(f"{{{NS}}}{tag}")
                    return el.text.strip() if el is not None and el.text else "N/A"

                parti = []
                for parte in dosar.findall(f".//{{{NS}}}DosarParte"):
                    if parte.get("{http://www.w3.org/2001/XMLSchema-instance}nil") == "true":
                        continue
                    nume_el = parte.find(f"{{{NS}}}nume")
                    cal_el  = parte.find(f"{{{NS}}}calitateParte")
                    if nume_el is not None and nume_el.text:
                        parti.append({
                            "nume": nume_el.text.strip(),
                            "calitate": cal_el.text.strip() if cal_el is not None and cal_el.text else "N/A"
                        })

                sedinte = []
                for sedinta in dosar.findall(f".//{{{NS}}}DosarSedinta"):
                    if sedinta.get("{http://www.w3.org/2001/XMLSchema-instance}nil") == "true":
                        continue
                    def gs(tag):
                        el = sedinta.find(f"{{{NS}}}{tag}")
                        return el.text.strip() if el is not None and el.text else "N/A"
                    sedinte.append({
                        "data": gs("data"),
                        "ora": gs("ora"),
                        "complet": gs("complet"),
                        "solutie": gs("solutie"),
                    })

                data_dosar = "N/A"
                if sedinte:
                    try:
                        data_dosar = sorted(sedinte, key = lambda s: s["data"])[0]["data"]
                    except Exception:
                        pass

                dosare.append({
                    "numar": g("numar"),
                    "data": data_dosar,
                    "status": g("stadiuProcesualNume"),
                    "instanta": g("institutie"),
                    "sectie": g("sectie"),
                    "obiect": g("obiect"),
                    "parti": parti,
                    "sedinte": sedinte,
                })

        except ET.ParseError as e:
            print(f"Eroare: {e}")
        return dosare

    def _filtreaza_relevante(self, dosare: list, termen_cautat: str) -> list:
        termeni = termen_cautat.upper().split()
        dosare_relevante = []
        for d in dosare:
            for parte in d["parti"]:
                nume_upper = parte["nume"].upper()
                if all(t in nume_upper for t in termeni):
                    dosare_relevante.append(d)
                    break
        return dosare_relevante

    def _build_url(self, numar: str) -> str:
        try:
            segmente = numar.split("/")
            if len(segmente) >= 2:
                id_inst = segmente[1].strip()
                id_dosar = hashlib.md5(numar.encode()).hexdigest()
                return f"https://portal.just.ro/{id_inst}/SitePages/Dosar.aspx?id_dosar={id_dosar}&id_inst={id_inst}"
        except Exception:
            pass
        return f"https://portal.just.ro/SitePages/cautare.aspx"

    def search(self, target: str):
        print(f"[PortalJust] Search: {target}")

        dosare_brute    = self.cauta_dosare(nume_parte = target)
        dosare_filtrate = self._filtreaza_relevante(dosare_brute, target)

        print(f"[PortalJust] {len(dosare_brute)} dosare brute, {len(dosare_filtrate)} relevante pentru \"{target}\"")

        graph_nodes = []
        seen_parti  = set()
        seen_dosare = set()

        for dosar in dosare_filtrate:
            numar  = dosar["numar"]
            obiect = dosar["obiect"]

            # Noduri parti
            for parte in dosar["parti"]:
                nume_parte = parte["nume"]
                if nume_parte not in seen_parti:
                    seen_parti.add(nume_parte)
                    parte_id = hashlib.md5(nume_parte.encode()).hexdigest()
                    graph_nodes.append({
                        "id": f"person_{parte_id}",
                        "type": "Person",
                        "label": nume_parte,
                        "summary": f"{parte['calitate']} in dosare judiciare",
                        "url": "N/A",
                    })

            if numar not in seen_dosare:
                seen_dosare.add(numar)
                dosar_id = hashlib.md5(numar.encode()).hexdigest()
                graph_nodes.append({
                    "id": f"doc_{dosar_id}",
                    "type": "Document",
                    "label": f"Dosar {numar}",
                    "summary": f"{obiect} — {dosar['instanta']} | Status: {dosar['status']}",
                    "url": self._build_url(numar),
                })

        return {
            "source": "portal just scraper",
            "type": "document",
            "certainty": "0",
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": "portal.just.ro",
                "count": len(graph_nodes),
            },

            # "metadata": {
            #     "timestamp": datetime.now().isoformat(),
            #     "source": "portal.just.ro",

            #     "query": {
            #         "target": target
            #     },

            #     "stats": {
            #         "nodes": len(graph_nodes),
            #         "raw_cases": len(dosare_brute),
            #         "filtered_cases": len(dosare_filtrate)
            #     },

            #     "distribution": {
            #         "persons": len(seen_parti),
            #         "documents": len(seen_dosare)
            #     },

            #     "institutions": list(set(
            #         d.get("instanta", "") for d in dosare_filtrate if d.get("instanta")
            #     )),

            #     "uids_count": len(seen_dosare),

            #     "scrape_info": {
            #         "base_url": SOAP_URL,
            #         "parser": "soap_xml_portal_just",
            #         "method": "CautareDosare"
            #     }
            # }

            "nodes": graph_nodes,
        }

# le-am lasat comentate
# if __name__ == "__main__":
#     scraper = PortalJustScraper()
#     while True:
#         print("\n" + "="*60)
#         print("PORTAL JUST — Cautare Dosare")
#         print("="*60)
#         print("1. Cauta dupa nume persoana / firma")
#         print("2. Cauta dupa numar dosar")
#         optiune = input("Alege (1/2): ").strip()
#
#         if optiune == "1":
#             termen = input("Nume persoana sau firma: ").strip()
#             print(f"\nCaut dosare pentru: {termen}...")
#             dosare = scraper.cauta_dosare(nume_parte=termen)
#         elif optiune == "2":
#             numar = input("Numar dosar (ex: 1234/3/2023): ").strip()
#             termen = numar
#             print(f"\nCaut dosar: {numar}...")
#             dosare = scraper.cauta_dosare(nume_parte=numar)
#         else:
#             print("Optiune invalida.")
#             continue
#
#         firme = scraper._filtreaza_relevante(dosare, termen)
#         raspuns = input("\nVrei sa cauti alt dosar? (da/nu): ").strip().lower()
#         if raspuns != "da":
#             print("La revedere!")
#             break