import requests
import xml.etree.ElementTree as ET
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SOAP_URL = "http://portalquery.just.ro/query.asmx"
HEADERS = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": "portalquery.just.ro/CautareDosare",
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/xml"
}
NS = "portalquery.just.ro"


def cauta_dosare(nume_parte: str = "") -> list:
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
        r = requests.post(SOAP_URL, data=body.encode("utf-8"), headers=HEADERS, timeout=30)
        print(f"  [debug] HTTP status: {r.status_code}")
        r.raise_for_status()
        return parseaza_raspuns(r.text)
    except Exception as e:
        print(f"[portal.just.ro] Eroare: {e}")
        return []


def parseaza_raspuns(xml_text: str) -> list:
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
                        "nume":     nume_el.text.strip(),
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
                    "data":    gs("data"),
                    "ora":     gs("ora"),
                    "complet": gs("complet"),
                    "solutie": gs("solutie"),
                })

            # Data estimata din prima sedinta
            data_dosar = "N/A"
            if sedinte:
                try:
                    data_dosar = sorted(sedinte, key=lambda s: s["data"])[0]["data"]
                except Exception:
                    pass

            dosare.append({
                "numar":    g("numar"),
                "data":     data_dosar,
                "status":   g("stadiuProcesualNume"),
                "instanta": g("institutie"),
                "sectie":   g("sectie"),
                "obiect":   g("obiect"),
                "parti":    parti,
                "sedinte":  sedinte,
            })

    except ET.ParseError as e:
        print(f"[XML Parse] Eroare: {e}")
    return dosare


def afiseaza_dosare(dosare: list, termen_cautat: str) -> list:
    if not dosare:
        print("  Nu s-au gasit dosare.")
        return []

    termeni = termen_cautat.upper().split()

    dosare_relevante = []
    for d in dosare:
        for parte in d["parti"]:
            nume_upper = parte["nume"].upper()
            if all(t in nume_upper for t in termeni):
                dosare_relevante.append(d)
                break

    if not dosare_relevante:
        print(f"  Nu s-au gasit dosare pentru '{termen_cautat}' ca parte exacta.")
        print(f"  (API-ul a returnat {len(dosare)} dosare cu potrivire partiala)")
        return []

    print(f"\n  Gasite {len(dosare_relevante)} dosare relevante "
          f"(din {len(dosare)} returnate de API):\n")

    firme_gasite = []
    for i, d in enumerate(dosare_relevante, 1):
        print(f"  {'='*55}")
        print(f"  {i}. Dosar: {d['numar']}")
        print(f"     Data:    {d['data']}")
        print(f"     Status:  {d['status']}")
        print(f"     Instanta:{d['instanta']}")
        print(f"     Sectie:  {d['sectie']}")
        print(f"     Obiect:  {d['obiect']}")
        if d["parti"]:
            print(f"     Parti:")
            for p in d["parti"]:
                nume_upper = p["nume"].upper()
                marker = " ← CAUTAT" if all(t in nume_upper for t in termeni) else ""
                print(f"       - [{p['calitate']}] {p['nume']}{marker}")
                if any(tip in p["nume"].upper() for tip in ["SRL", " SA", " RA", "SNC", "SCS"]):
                    if p["nume"] not in firme_gasite:
                        firme_gasite.append(p["nume"])

    return firme_gasite


def cauta_firma_anaf(nume_firma: str) -> dict:
    from urllib.parse import quote
    try:
        r = requests.get(
            f"https://demoanaf.ro/api/search?q={quote(nume_firma)}",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[DemoANAF search] Eroare: {e}")
        return {}


def afiseaza_date_anaf(cui: str):
    try:
        import anaf
        anaf_data    = anaf.get_anaf_data(cui)
        company_data = anaf.get_company(cui)
        financials   = anaf.get_financials(cui)
        anaf.afiseaza(anaf_data, company_data, financials, {})
    except ImportError:
        print("  [!] anaf.py nu a fost gasit.")
    except Exception as e:
        print(f"  [!] Eroare ANAF: {e}")


if __name__ == "__main__":
    while True:
        print("\n" + "="*60)
        print("PORTAL JUST — Cautare Dosare")
        print("="*60)
        print("1. Cauta dupa nume persoana / firma")
        print("2. Cauta dupa numar dosar")
        optiune = input("Alege (1/2): ").strip()

        if optiune == "1":
            termen = input("Nume persoana sau firma: ").strip()
            print(f"\nCaut dosare pentru: {termen}...")
            dosare = cauta_dosare(nume_parte=termen)
        elif optiune == "2":
            numar = input("Numar dosar (ex: 1234/3/2023): ").strip()
            termen = numar
            print(f"\nCaut dosar: {numar}...")
            dosare = cauta_dosare(nume_parte=numar)
        else:
            print("Optiune invalida.")
            continue

        firme = afiseaza_dosare(dosare, termen)

        if firme:
            print(f"\n{'='*60}")
            print(f"FIRME DETECTATE IN DOSARE — verificare ANAF")
            print(f"{'='*60}")
            for nume_firma in firme:
                print(f"\n  Caut '{nume_firma}' in ANAF...")
                rezultat = cauta_firma_anaf(nume_firma)
                lista = rezultat.get("data", [])
                if lista:
                    for f in lista[:3]:
                        cui = str(f.get("cui", ""))
                        print(f"  ✓ Gasita: {f.get('name','?')} — CUI: {cui}")
                        raspuns = input(f"  Vrei datele complete ANAF? (da/nu): ").strip().lower()
                        if raspuns == "da":
                            afiseaza_date_anaf(cui)
                else:
                    print(f"  ✗ '{nume_firma}' nu a fost gasita in ANAF.")

        raspuns = input("\nVrei sa cauti alt dosar? (da/nu): ").strip().lower()
        if raspuns != "da":
            print("La revedere!")
            break