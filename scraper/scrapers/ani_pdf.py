import os
import time
import pyautogui
from human_mouse import MouseController
import asyncio
from playwright.async_api import async_playwright
from pypdf import PdfReader

mouse = MouseController(always_zigzag=True)

# --- CONFIGURARE ---
URL_TINTA = "https://declaratii.integritate.eu/"
NUME_CAUTAT = "Ion Popescu"  # Schimbă aici numele dorit
FOLDER_TEMPORAR = "./temp_pdfs"

async def extrage_text_din_pdf(cale_fisier):
    """Transformă PDF-ul în text brut și îl returnează."""
    try:
        reader = PdfReader(cale_fisier)
        text_complet = ""
        for pagina in reader.pages:
            text_complet += pagina.extract_text() or ""
        return text_complet.strip()
    except Exception as e:
        print(f"[-] Eșec la citirea PDF-ului: {e}")
        return None

async def ruleaza_scraper():
    # Cream folderul temporar dacă nu există
    if not os.path.exists(FOLDER_TEMPORAR):
        os.makedirs(FOLDER_TEMPORAR)

    async with async_playwright() as p:
        # headless=False te lasă să vezi cum se mișcă robotul
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        print(f"[*] Navigăm la {URL_TINTA}")
        await page.goto(URL_TINTA, wait_until="networkidle")

        # 1. FAZA DE CĂUTARE
        selector_input = "#ssidLastName"
        selector_buton = 'button.btn-success:has-text("Cautare")'

        try:
            print(f"[*] Introducem numele: {NUME_CAUTAT}")
            await page.wait_for_selector(selector_input, state="visible", timeout=10000)
            await page.fill(selector_input, NUME_CAUTAT)
            
            print("[*] Apăsăm butonul 'Cautare'...")
            await page.click(selector_buton)
        except Exception as e:
            print(f"[-] Eroare la interfață: {e}")
            await browser.close()
            return

        # 2. FAZA DE RECOLTARE
        print("[*] Așteptăm tabelul cu rezultate...")
        try:                    
            time.sleep(10)
            mouse.move(542,79,speed_factor=0.01)
            mouse.move(780,640,speed_factor=0.01)
            pyautogui.click()
            # Angular are nevoie de timp să randeze tabelul după click
            await page.wait_for_selector("table tr", timeout=15000)
        except:
            print("[-] Nu au apărut rezultate. Verifică numele sau site-ul.")
            #await browser.close()
            return

        rows = await page.query_selector_all("table tr")
        # Sărim peste header (prima linie)
        for i, row in enumerate(rows[1:4]): 
            try:
                # Căutăm link-ul de download din rândul curent
                buton_pdf = await row.query_selector('a[href*="pdf"], .fa-file-pdf')
                if not buton_pdf:
                    continue

                # 3. DESCARCAREA
                async with page.expect_download() as download_info:
                    await buton_pdf.click()
                
                download = await download_info.value
                cale_pdf = os.path.join(FOLDER_TEMPORAR, f"doc_{i}.pdf")
                await download.save_as(cale_pdf)
                print(f"[+] Descarcat: {cale_pdf}")

                # 4. EXTRACȚIE TEXT
                text = await extrage_text_din_pdf(cale_pdf)
                if text:
                    print(f"[!] TEXT EXTRAS (primele 150 ch):\n{text[:150]}...")
                
                # 5. ȘTERGERE (Cleanup instant)
                os.remove(cale_pdf)
                print(f"[*] Fișier șters: {cale_pdf}")

            except Exception as e:
                print(f"[-] Problemă la rândul {i+1}: {e}")

        print("[*] S-a terminat „recolta”.")
        #await browser.close()

if __name__ == "__main__":
    asyncio.run(ruleaza_scraper())