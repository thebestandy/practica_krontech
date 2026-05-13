# ANAF Scraper

import requests
import json
import hashlib
import urllib3
from datetime import date, datetime
from time import sleep

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


class AnafScraper:
    ANAF_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva"
    DEMO_BASE = "https://demoanaf.ro/api"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def get_anaf_data(self, cui: str) -> dict:
        cui_curat = cui.upper().replace("RO", "").strip()
        payload = [{"cui": int(cui_curat), "data": str(date.today())}]
        try:
            r = self.session.post(
                self.ANAF_URL,
                json=payload,
                headers={**HEADERS, "Content-Type": "application/json"},
                timeout=15,
                verify=False,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"Eroare: {e}")
            return {}

    def get_cu_retry(self, url: str, incercari: int = 3, timeout: int = 30) -> dict:
        for i in range(incercari):
            try:
                r = self.session.get(url, timeout=timeout)
                r.raise_for_status()
                return r.json()
            except requests.exceptions.Timeout:
                print(f"Timeout - incerc din nou ({i + 1}/{incercari})...")
                sleep(2)
            except Exception as e:
                print(f"Eroare: {e}")
                break
        return {}

    def get_company(self, cui):
        return self.get_cu_retry(f"{self.DEMO_BASE}/company/{cui}")

    def get_financials(self, cui):
        return self.get_cu_retry(
            f"{self.DEMO_BASE}/company/{cui}/financials", timeout=45
        )

    def get_balance(self, cui, an):
        return self.get_cu_retry(
            f"{self.DEMO_BASE}/company/{cui}/balance/{an}", timeout=45
        )

    def search_company(self, q):
        return self.get_cu_retry(f"{self.DEMO_BASE}/search?q={q}")

    def _resolve_cui(self, target: str):
        cui_curat = target.upper().replace("RO", "").strip()
        if cui_curat.isdigit():
            return cui_curat

        print(f"[ANAF] Target non-numeric, caut dupa nume: {target}")
        rezultate = self.search_company(target)
        firme = rezultate.get("data", rezultate)
        if isinstance(firme, list) and firme:
            cui = str(firme[0].get("cui", firme[0].get("CUI", "")))
            if cui:
                print(f'[ANAF] Gasit CUI {cui} pentru "{target}"')
                return cui

        print(f'[ANAF] Nu s-a gasit niciun CUI pentru "{target}"')
        return None

    def search(self, target: str):
        cui = self._resolve_cui(target)

        if not cui:
            return {
                "source": "anaf scraper",
                "type": "document",
                "certainty": "0",
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "source": "ANAF",
                    "count": 0,
                },
                "nodes": [],
            }

        print(f"\nInteroghez toate sursele pentru CUI: {cui}...")
        anaf_data = self.get_anaf_data(cui)
        company_data = self.get_company(cui)
        print("Interoghez financials (poate dura 30-45 sec)...")
        financials = self.get_financials(cui)

        firma = anaf_data.get("found", [{}])[0] if anaf_data.get("found") else {}
        dg = firma.get("date_generale", {})
        adresa = firma.get("adresa_sediu_social", {})
        tva = firma.get("inregistrare_scop_Tva", {})
        inactiv = firma.get("stare_inactiv", {})

        denumire = dg.get("denumire", "")
        stare = dg.get("stare_inregistrare", "")
        judet = adresa.get("sdenumire_Judet", "")
        localitate = adresa.get("sdenumire_Localitate", "")
        adresa_str = f"{judet}, {localitate}" if judet or localitate else "N/A"

        graph_nodes = []

        person_id = hashlib.md5(f"{cui}_{denumire}".encode()).hexdigest()
        graph_nodes.append(
            {
                "id": f"person_{person_id}",
                "type": "Person",
                "label": denumire or f"CUI {cui}",
                "summary": f"{stare} — {adresa_str}",
                "url": f"https://www.anaf.ro/anaf/internet/RO/cautare-dupa-cui?cui={cui}",
                "metadata": {
                    "anaf_date_generale": dg,
                    "anaf_adresa": adresa,
                    "anaf_tva_status": tva,
                    "anaf_inactiv_status": inactiv,
                    "company_data_raw": company_data.get("data", {}),
                },
            }
        )

        data = company_data.get("data", {})
        admini = data.get("administrators", [])
        for a in admini:
            admin_name = a.get("name", "")
            admin_role = a.get("role", "")
            if not admin_name:
                continue
            admin_id = hashlib.md5(f"{admin_name}_{cui}".encode()).hexdigest()
            graph_nodes.append(
                {
                    "id": f"person_{admin_id}",
                    "type": "Person",
                    "label": admin_name,
                    "summary": f"{admin_role} la {denumire or cui}",
                    "url": "N/A",
                    "metadata": {"raw_admin_data": a},
                }
            )

        fin_data = financials.get("data", [])
        for an_fin in fin_data:
            an = an_fin.get("year", "?")
            eur = an_fin.get("eurRate", 1) or 1
            ind_map = {i["code"]: i["value"] for i in an_fin.get("indicators", [])}

            cifra_afaceri = ind_map.get("I13", 0)
            profit_net = ind_map.get("I18", 0)
            pierdere_neta = ind_map.get("I19", 0)
            angajati = ind_map.get("I20", 0)
            rezultat_net = profit_net if profit_net else -pierdere_neta

            fin_id = hashlib.md5(f"{cui}_{an}".encode()).hexdigest()
            graph_nodes.append(
                {
                    "id": f"doc_{fin_id}",
                    "type": "Document",
                    "label": f"Situatie financiara {an} — {denumire or cui}",
                    "summary": (
                        f"CA: {int(cifra_afaceri):,} RON"
                        f" | Rezultat net: {int(rezultat_net):,} RON"
                        f" | Angajati: {int(angajati)}"
                    ),
                    "url": f"https://mfinante.gov.ro/ro/web/efin/rezultate-bilant?cui={cui}",
                    "metadata": {
                        "year": an,
                        "eur_exchange_rate": eur,
                        "all_indicators_mapped": ind_map,
                        "raw_financial_statement": an_fin,
                    },
                }
            )

        return {
            "source": "anaf scraper",
            "type": "document",
            "certainty": "0",
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": "ANAF / demoanaf.ro",
                "count": len(graph_nodes),
            },
            "nodes": graph_nodes,
        }

        # return {
        #     "source": "anaf scraper",
        #     "type": "document",
        #     "certainty": "0",

        #     "metadata": {
        #         "timestamp": datetime.now().isoformat(),
        #         "source": "ANAF / demoanaf.ro",
        #         "count": len(graph_nodes),

        #         "anaf_details": {
        #             "date_generale": dg,
        #             "adresa_completa": adresa,
        #             "tva": tva,
        #             "stare_inactiv": inactiv,
        #         },

        #         "company_details": company_data.get("data", {}),

        #         "financials_raw": financials.get("data", []),

        #         "raw_responses": {
        #             "anaf": anaf_data,
        #             "company": company_data,
        #             "financials": financials,
        #         },
        #     },

        #     "nodes": graph_nodes,
        # }


# le-am lasat comentate
# if __name__ == "__main__":
#     scraper = AnafScraper()
#     while True:
#         print("\n=== CAUTARE FIRMA ===")
#         print("1. Stiu CUI-ul")
#         print("2. Caut dupa nume")
#         optiune = input("Alege (1/2): ").strip()
#
#         if optiune == "2":
#             query = input("Introdu numele firmei: ").strip()
#             rezultate = scraper.search_company(query)
#             print("\nREZULTATE CAUTARE:")
#             firme = rezultate.get("data", rezultate)
#             if isinstance(firme, list):
#                 for f in firme:
#                     print(f"  CUI: {f.get('cui','?')}  —  {f.get('name', f.get('denumire','?'))}")
#             else:
#                 print(json.dumps(rezultate, indent=2, ensure_ascii=False))
#             cui_input = input("\nIntrodu CUI-ul din lista de mai sus: ").strip()
#         else:
#             cui_input = input("Introdu CUI-ul firmei: ").strip()
#
#         an_input = input("Introdu anul pentru bilant (ex: 2022): ").strip()
#         cui_curat = cui_input.upper().replace("RO", "").strip()
#
#         anaf_data    = scraper.get_anaf_data(cui_curat)
#         company_data = scraper.get_company(cui_curat)
#         financials   = scraper.get_financials(cui_curat)
#         balance      = scraper.get_balance(cui_curat, int(an_input))
#
#         afiseaza(anaf_data, company_data, financials, balance)
#
#         raspuns = input("\nVrei sa cauti alta firma? (da/nu): ").strip().lower()
#         if raspuns != "da":
#             print("La revedere!")
#             break

