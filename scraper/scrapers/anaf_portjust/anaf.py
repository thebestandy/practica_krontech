import requests
import json
import urllib3
from datetime import date
from time import sleep

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def get_anaf_data(cui: str) -> dict:
    cui_curat = cui.upper().replace("RO", "").strip()
    url = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva"
    payload = [{"cui": int(cui_curat), "data": str(date.today())}]
    try:
        r = requests.post(url, json=payload, headers={**HEADERS, "Content-Type": "application/json"}, timeout=15, verify=False)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[ANAF] Eroare: {e}")
        return {}

def get_cu_retry(url: str, incercari: int = 3, timeout: int = 30) -> dict:
    for i in range(incercari):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.Timeout:
            print(f"  [!] Timeout — incerc din nou ({i+1}/{incercari})...")
            sleep(2)
        except Exception as e:
            print(f"  [!] Eroare: {e}")
            break
    return {}

def get_company(cui):   return get_cu_retry(f"https://demoanaf.ro/api/company/{cui}")
def get_financials(cui): return get_cu_retry(f"https://demoanaf.ro/api/company/{cui}/financials", timeout=45)
def get_balance(cui, an): return get_cu_retry(f"https://demoanaf.ro/api/company/{cui}/balance/{an}", timeout=45)
def search_company(q):  return get_cu_retry(f"https://demoanaf.ro/api/search?q={q}")

def format_ron(valoare: int) -> str:
    """Formatează un număr ca RON — ex: 4,051,518 RON"""
    return f"{valoare:,} RON".replace(",", ".")

def afiseaza(anaf: dict, company: dict, financials: dict, balance: dict):
    firma = anaf.get("found", [{}])[0] if anaf.get("found") else {}
    dg = firma.get("date_generale", {})
    adresa = firma.get("adresa_sediu_social", {})
    tva = firma.get("inregistrare_scop_Tva", {})
    inactiv = firma.get("stare_inactiv", {})

    print("\n" + "="*60)
    print("DATE GENERALE (ANAF oficial)")
    print("="*60)
    print(f"Denumire:           {dg.get('denumire', 'N/A')}")
    print(f"CUI:                {dg.get('cui', 'N/A')}")
    print(f"Nr. Reg. Com.:      {dg.get('nrRegCom', 'N/A')}")
    print(f"Cod CAEN:           {dg.get('cod_CAEN', 'N/A')}")
    print(f"Forma juridica:     {dg.get('forma_juridica', 'N/A')}")
    print(f"Forma proprietate:  {dg.get('forma_de_proprietate', 'N/A')}")
    print(f"Stare:              {dg.get('stare_inregistrare', 'N/A')}")
    print(f"Telefon:            {dg.get('telefon', 'N/A')}")
    print(f"Organ fiscal:       {dg.get('organFiscalCompetent', 'N/A')}")

    print("\nADRESA")
    print("-"*60)
    print(f"Judet:     {adresa.get('sdenumire_Judet','N/A')} ({adresa.get('scod_JudetAuto','')})")
    print(f"Localitate:{adresa.get('sdenumire_Localitate','N/A')}")
    print(f"Strada:    {adresa.get('sdenumire_Strada','N/A')} nr. {adresa.get('snumar_Strada','')}")
    print(f"Cod Postal:{adresa.get('scod_Postal','N/A')}")

    print("\nSTATUT TVA & FISCAL")
    print("-"*60)
    print(f"Platitor TVA:  {tva.get('scpTVA', False)}")
    print(f"Inactiv:       {inactiv.get('statusInactivi', False)}")

    # Administratori
    data = company.get("data", {})
    admini = data.get("administrators", [])
    if admini:
        print("\nADMINISTRATORI")
        print("-"*60)
        for a in admini:
            print(f"  {a.get('role','').upper():<45} {a.get('name','N/A')}")

    coduri_caen = data.get("authorizedCaenCodes", [])
    if coduri_caen:
        print(f"\nCoduri CAEN autorizate: {', '.join(coduri_caen)}")
    print(f"Status ONRC:            {data.get('onrcStatusLabel', 'N/A')}")

    # Financiare — afișare frumoasă
    fin_data = financials.get("data", [])
    if fin_data:
        for an_fin in fin_data:
            print("\n" + "="*60)
            print(f"FINANCIARE {an_fin.get('year','?')} — {an_fin.get('caenDescription','')}")
            print("="*60)
            eur = an_fin.get("eurRate", 1)
            indicatori_cheie = {
                "I13": "Cifra de afaceri",
                "I14": "Total venituri",
                "I15": "Total cheltuieli",
                "I16": "Profit brut",
                "I17": "Pierdere bruta",
                "I18": "Profit net",
                "I19": "Pierdere neta",
                "I1":  "Active imobilizate",
                "I2":  "Active circulante",
                "I5":  "Cash & conturi bancare",
                "I4":  "Creante",
                "I7":  "Total datorii",
                "I10": "Total capitaluri",
                "I11": "Capital social",
                "I20": "Numar mediu angajati",
            }
            ind_map = {i["code"]: i["value"] for i in an_fin.get("indicators", [])}
            for cod, label in indicatori_cheie.items():
                val = ind_map.get(cod, 0)
                if cod == "I20":
                    print(f"  {label:<30} {val} persoane")
                else:
                    eur_val = int(val / eur) if eur else 0
                    print(f"  {label:<30} {format_ron(val):>20}  (~{eur_val:,} EUR)")
    else:
        print("\n[!] Nu s-au gasit date financiare.")

    # Bilant
    if balance and balance.get("data"):
        print("\n" + "="*60)
        print("BILANT DETALIAT (/balance)")
        print("="*60)
        print(json.dumps(balance["data"], indent=2, ensure_ascii=False))
    else:
        print("\n[!] Bilant — nu s-au gasit date (incearca 2022 sau 2023).")

if __name__ == "__main__":
    while True:
        print("\n=== CAUTARE FIRMA ===")
        print("1. Stiu CUI-ul")
        print("2. Caut dupa nume")
        optiune = input("Alege (1/2): ").strip()

        if optiune == "2":
            query = input("Introdu numele firmei: ").strip()
            rezultate = search_company(query)
            print("\nREZULTATE CAUTARE:")
            firme = rezultate.get("data", rezultate)
            if isinstance(firme, list):
                for f in firme:
                    print(f"  CUI: {f.get('cui','?')}  —  {f.get('name', f.get('denumire','?'))}")
            else:
                print(json.dumps(rezultate, indent=2, ensure_ascii=False))
            cui_input = input("\nIntrodu CUI-ul din lista de mai sus: ").strip()
        else:
            cui_input = input("Introdu CUI-ul firmei: ").strip()

        an_input = input("Introdu anul pentru bilant (ex: 2022): ").strip()
        cui_curat = cui_input.upper().replace("RO", "").strip()

        print(f"\nInteroghez toate sursele pentru CUI: {cui_curat}...")
        anaf_data    = get_anaf_data(cui_curat)
        company_data = get_company(cui_curat)
        print("Interoghez financials (poate dura 30-45 sec)...")
        financials   = get_financials(cui_curat)
        print(f"Interoghez bilant {an_input}...")
        balance      = get_balance(cui_curat, int(an_input))

        afiseaza(anaf_data, company_data, financials, balance)

        # ─── ÎNTREBARE LA FINAL ───
        raspuns = input("\nVrei sa cauti alta firma? (da/nu): ").strip().lower()
        if raspuns != "da":
            print("La revedere!")
            break