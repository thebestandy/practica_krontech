# ANI_PDF Scraper

import time
import re
import os
import json
import logging
from dataclasses import dataclass, asdict, field
from typing import List, Optional
from pathlib import Path
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ani_scraper")

@dataclass
class DeclarationPDF:
    title: str
    year: str
    type: str          # "avere" / "interese" / "unknown"
    url: str
    unique_id: str
    source: str        # "legacy" / "modern" / "depozitar"
    downloaded: bool = False
    filepath: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class PersonResult:
    name: str
    institution: str
    position: str = ""
    source: str = ""
    pdfs: List[DeclarationPDF] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "institution": self.institution,
            "position": self.position,
            "source": self.source,
            "pdfs": [p.to_dict() for p in self.pdfs],
        }

def _build_driver(headless: bool = True, download_dir: Optional[str] = None) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    if download_dir:
        prefs = {
            "download.default_directory": str(Path(download_dir).absolute()),
            "download.prompt_for_download": False,
            "plugins.always_open_pdf_externally": True,
        }
        opts.add_experimental_option("prefs", prefs)

    return webdriver.Chrome(options = opts)

def _extract_year(text: str) -> str:
    m = re.search(r'\b(20\d{2})\b', text)
    return m.group(1) if m else ""

def _extract_type(text: str) -> str:
    t = text.lower()
    if "avere" in t:
        return "avere"
    if "interese" in t:
        return "interese"
    return "unknown"

def _extract_uid_legacy(url: str) -> str:
    for param in ("uniqueIdentifier=", "fileName = "):
        if param in url:
            return url.split(param)[1].split("&")[0]
    return url.split("/")[-1]


class LegacyScraper:
    BASE = "https://old-declaratii.integritate.eu"
    SEARCH_URL = f"{BASE}/index.html"

    def __init__(self, driver: webdriver.Chrome, delay: float = 1.5):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.delay = delay

    def search(self, name: str) -> List[PersonResult]:
        log.info(f"[LEGACY] Cautare: {name!r}")
        try:
            self.driver.get(self.SEARCH_URL)
            self.wait.until(EC.presence_of_element_located((By.ID, "form:searchKey_input")))
            time.sleep(self.delay)

            inp = self.driver.find_element(By.ID, "form:searchKey_input")
            inp.clear()
            inp.send_keys(name)

            sel = Select(self.driver.find_element(By.ID, "form:searchField_input"))
            sel.select_by_value("numePrenume")

            self.driver.find_element(By.ID, "form:submitButtonSS").click()
            time.sleep(2 + self.delay)

            return self._parse()
        except Exception as e:
            log.error(f"[LEGACY] Eroare: {e}")
            return []

    def _parse(self) -> List[PersonResult]:
        soup = BeautifulSoup(self.driver.page_source, "lxml")
        results = []

        rows = (
            soup.select("tr.result, tr.data-row, .result-row, .search-result")
            or soup.find_all("tr", class_=re.compile(r"result|data|row", re.I))
        )

        if not rows:
            rows = [
                tr for tr in soup.find_all("tr")
                if tr.find("a", href=re.compile(r"DownloadServlet"))
            ]

        log.info(f"[LEGACY] Randuri gasite: {len(rows)}")

        for row in rows:
            try:
                cells = row.find_all("td")
                name = cells[0].get_text(strip=True) if len(cells) > 0 else ""
                institution = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                position = cells[2].get_text(strip=True) if len(cells) > 2 else ""

                pdfs = self._extract_pdfs(row)
                if pdfs:
                    results.append(PersonResult(
                        name = name,
                        institution = institution,
                        position = position,
                        source = "legacy",
                        pdfs = pdfs,
                    ))
            except Exception as e:
                log.debug(f"[LEGACY] Eroare la parsare rand: {e}")

        return results

    def _extract_pdfs(self, row) -> List[DeclarationPDF]:
        pdfs = []
        for a in row.find_all("a", href=re.compile(r"DownloadServlet")):
            href = a.get("href", "")
            if href.startswith("/"):
                href = self.BASE + href
            text = a.get_text(strip=True)
            uid = _extract_uid_legacy(href)
            pdfs.append(DeclarationPDF(
                title = text or f"Declaration {uid}",
                year = _extract_year(text) or _extract_year(row.get_text()),
                type = _extract_type(text),
                url = href,
                unique_id = uid,
                source = "legacy",
            ))
        return pdfs

class ModernScraper:
    BASE = "https://declaratii.integritate.eu"

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.driver = driver
        self.wait = WebDriverWait(driver, 25)
        self.delay = delay

    def search(self, name: str) -> List[PersonResult]:
        log.info(f"[MODERN] Cautare: {name!r}")
        try:
            self.driver.get(self.BASE)
            time.sleep(self.delay)

            search_input = self._find_search_input()
            if not search_input:
                log.warning("[MODERN] Campul de cautare nu a fost gasit.")
                return []

            search_input.clear()
            search_input.send_keys(name)
            time.sleep(0.5)

            # Submit
            self._submit_search()
            time.sleep(3 + self.delay)

            return self._parse(name)
        except Exception as e:
            log.error(f"[MODERN] Eroare: {e}")
            return []

    def _find_search_input(self):
        selectors = [
            (By.CSS_SELECTOR, "input[type='search']"),
            (By.CSS_SELECTOR, "input[placeholder*='ume']"),   # Nume
            (By.CSS_SELECTOR, "input[placeholder*='auta']"),  # Cauta
            (By.CSS_SELECTOR, ".search-input input"),
            (By.CSS_SELECTOR, "input.p-inputtext"),           # PrimeNG
            (By.CSS_SELECTOR, "input[type='text']"),
        ]
        for by, sel in selectors:
            try:
                el = self.driver.find_element(by, sel)
                if el.is_displayed():
                    return el
            except NoSuchElementException:
                continue
        return None

    def _submit_search(self):
        try:
            btn = self.driver.find_element(
                By.CSS_SELECTOR,
                "button[type='submit'], .search-btn, button.p-button"
            )
            btn.click()
        except NoSuchElementException:
            from selenium.webdriver.common.keys import Keys
            inp = self._find_search_input()
            if inp:
                inp.send_keys(Keys.RETURN)

    def _parse(self, searched_name: str) -> List[PersonResult]:
        soup = BeautifulSoup(self.driver.page_source, "lxml")
        results = []

        pdf_links = soup.find_all("a", href=re.compile(r"\.pdf", re.I))

        if not pdf_links:
            pdf_links = soup.find_all("a", href=re.compile(r"/download/|/fisier/|/pdf/|declaratie", re.I))

        log.info(f"[MODERN] Link-uri PDF gasite: {len(pdf_links)}")

        pdfs = []
        for a in pdf_links:
            href = a.get("href", "")
            if href.startswith("/"):
                href = self.BASE + href
            text = a.get_text(strip = True)
            uid = href.split("/")[-1]
            pdfs.append(DeclarationPDF(
                title = text or uid,
                year = _extract_year(text) or _extract_year(a.find_parent().get_text() if a.find_parent() else ""),
                type = _extract_type(text),
                url = href,
                unique_id = uid,
                source = "modern",
            ))

        if pdfs:
            results.append(PersonResult(
                name = searched_name,
                institution = "",
                source = "modern",
                pdfs = pdfs,
            ))

        return results

class DepozitarScraper:
    BASE = "https://depozitar.integritate.eu"

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.driver = driver
        self.wait = WebDriverWait(driver, 25)
        self.delay = delay

    def search(self, name: str) -> List[PersonResult]:
        log.info(f"[DEPOZITAR] Cautare: {name!r}")
        try:
            self.driver.get(self.BASE)
            time.sleep(self.delay)

            search_input = self._find_search_input()
            if not search_input:
                log.warning("[DEPOZITAR] Campul de cautare nu a fost gasit.")
                return []

            search_input.clear()
            search_input.send_keys(name)
            time.sleep(0.5)
            self._submit_search()
            time.sleep(3 + self.delay)

            return self._parse(name)
        except Exception as e:
            log.error(f"[DEPOZITAR] Eroare: {e}")
            return []

    def _find_search_input(self):
        selectors = [
            (By.CSS_SELECTOR, "input[type='search']"),
            (By.CSS_SELECTOR, "input[placeholder*='ume']"),
            (By.CSS_SELECTOR, "input[placeholder*='auta']"),
            (By.CSS_SELECTOR, "input.p-inputtext"),
            (By.CSS_SELECTOR, "input[type='text']"),
        ]
        for by, sel in selectors:
            try:
                el = self.driver.find_element(by, sel)
                if el.is_displayed():
                    return el
            except NoSuchElementException:
                continue
        return None

    def _submit_search(self):
        try:
            btn = self.driver.find_element(
                By.CSS_SELECTOR,
                "button[type='submit'], .search-btn, button.p-button"
            )
            btn.click()
        except NoSuchElementException:
            from selenium.webdriver.common.keys import Keys
            inp = self._find_search_input()
            if inp:
                inp.send_keys(Keys.RETURN)

    def _parse(self, searched_name: str) -> List[PersonResult]:
        soup = BeautifulSoup(self.driver.page_source, "lxml")
        results = []

        pdf_links = soup.find_all("a", href=re.compile(r"\.pdf|/download/|/fisier/|declaratie", re.I))

        log.info(f"[DEPOZITAR] Link-uri PDF gasite: {len(pdf_links)}")

        pdfs = []
        for a in pdf_links:
            href = a.get("href", "")
            if href.startswith("/"):
                href = self.BASE + href
            text = a.get_text(strip=True)
            uid = href.split("/")[-1]
            pdfs.append(DeclarationPDF(
                title = text or uid,
                year = _extract_year(text),
                type = _extract_type(text),
                url = href,
                unique_id = uid,
                source = "depozitar",
            ))

        if pdfs:
            results.append(PersonResult(
                name = searched_name,
                institution = "",
                source = "depozitar",
                pdfs = pdfs,
            ))

        return results

class ANIScraper:

    def __init__(
        self,
        headless: bool = True,
        download_dir: str = "./scraper/scrapers/ani_pdf/downloads",
        delay: float = 1.5,
        sources: List[str] = None,  # ["legacy", "modern", "depozitar"] sau None = toate
    ):
        self.headless = headless
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents = True, exist_ok = True)
        self.delay = delay
        self.sources = sources or ["legacy", "modern", "depozitar"]
        self.driver = None

    def __enter__(self):
        self.driver = _build_driver(self.headless, str(self.download_dir))
        return self

    def __exit__(self, *_):
        if self.driver:
            self.driver.quit()
            self.driver = None

    def search(self, name: str) -> List[PersonResult]:
        if not self.driver:
            self.driver = _build_driver(self.headless, str(self.download_dir))

        all_results: List[PersonResult] = []

        if "legacy" in self.sources:
            scraper = LegacyScraper(self.driver, self.delay)
            all_results.extend(scraper.search(name))

        if "modern" in self.sources:
            scraper = ModernScraper(self.driver, self.delay)
            all_results.extend(scraper.search(name))

        if "depozitar" in self.sources:
            scraper = DepozitarScraper(self.driver, self.delay)
            all_results.extend(scraper.search(name))

        log.info(
            f"Total: {len(all_results)} persoana/persoane, "
            f"{sum(len(r.pdfs) for r in all_results)} PDF-uri"
        )
        return all_results

    def download_pdf(self, pdf: DeclarationPDF) -> str:
        safe = re.sub(r"[^\w\-]", "_", f"{pdf.source}_{pdf.year}_{pdf.unique_id}")
        filepath = self.download_dir / f"{safe}.pdf"

        try:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; ANIScraper/1.0)"}
            r = requests.get(pdf.url, headers = headers, stream = True, timeout = 30)
            if r.status_code == 200:
                with open(filepath, "wb") as f:
                    for chunk in r.iter_content(8192):
                        f.write(chunk)
                pdf.downloaded = True
                pdf.filepath = str(filepath)
                log.info(f"Descarcat: {filepath.name}")
                return str(filepath)
            else:
                log.warning(f"HTTP {r.status_code} pentru {pdf.url}")
        except Exception as e:
            log.error(f"Eroare download {pdf.url}: {e}")
        return ""

    def download_all(self, results: List[PersonResult]) -> int:
        count = 0
        for result in results:
            for pdf in result.pdfs:
                if self.download_pdf(pdf):
                    count += 1
                time.sleep(self.delay)
        return count

    def export_json(self, results: List[PersonResult], path: str = "results.json"):
        data = {
            "generated_at": datetime.now().isoformat(),
            "total_persons": len(results),
            "total_pdfs": sum(len(r.pdfs) for r in results),
            "results": [r.to_dict() for r in results],
        }
        with open(path, "w", encoding = "utf-8") as f:
            json.dump(data, f, ensure_ascii = False, indent = 2)
        log.info(f"Exportat in {path}")

    @staticmethod
    def print_results(results: List[PersonResult]):
        if not results:
            print("Nu s-au gasit rezultate.")
            return

        total_pdfs = sum(len(r.pdfs) for r in results)
        print(f"\n{'='*60}")
        print(f"{len(results)} persoana/persoane | {total_pdfs} PDF-uri totale")
        print(f"{'='*60}\n")

        for i, r in enumerate(results, 1):
            print(f"{i}. {r.name}")
            if r.institution:
                print(f"Institutie: {r.institution}")
            if r.position:
                print(f"Functie: {r.position}")
            print(f"Sursa: {r.source}")
            print(f"PDF-uri: {len(r.pdfs)}")
            for j, pdf in enumerate(r.pdfs, 1):
                print(f"{j:>2}. [{pdf.source}] {pdf.year} | {pdf.type:>8} | {pdf.title}")
                print(f"{pdf.url}")
            print()

def main():
    print("\nANI Scraper - Declaratii de avere")
    print("=" * 50)

    print("\nAlege sistemul:")
    print("1. Legacy")
    print("2. Modern")
    print("3. Depozitar")
    print("4. Toate")

    choice = input("\nAlege selectie: ").strip()

    match choice:

        case "1":
            name = input("\nNume pentru LEGACY: ").strip()

        case "2":
            name = input("\nNume pentru MODERN: ").strip()

        case "3":
            name = input("\nNume pentru DEPOZITAR: ").strip()

        case "4":
            legacy_name = input("\nNume LEGACY: ").strip()
            modern_name = input("Nume MODERN: ").strip()
            depozitar_name = input("Nume DEPOZITAR: ").strip()

        case _:
            print("\nOptiune invalida.")
            return

    scraper = ANIScraper(headless = False, delay = 1.5)

    try:
        scraper.driver = _build_driver(
            scraper.headless,
            str(scraper.download_dir)
        )

        match choice:
            case "1":

                scraper.sources = ["legacy"]

                results = scraper.search(name)

                ANIScraper.print_results(results)

                if results:
                    out = f"results_legacy_{re.sub(r'[^\\w]', '_', name)}.json"
                    scraper.export_json(results, out)

                    # print("Descarcare PDF-uri...")
                    # n = scraper.download_all(results)
                    # print(f"Descarcate: {n} fisiere in ./downloads/")

            case "2":

                scraper.sources = ["modern"]

                results = scraper.search(name)

                ANIScraper.print_results(results)

                if results:
                    out = f"results_modern_{re.sub(r'[^\\w]', '_', name)}.json"
                    scraper.export_json(results, out)

                    # print("Descarcare PDF-uri...")
                    # n = scraper.download_all(results)
                    # print(f"Descarcate: {n} fisiere in ./downloads/")

            case "3":

                scraper.sources = ["depozitar"]

                results = scraper.search(name)

                ANIScraper.print_results(results)

                if results:
                    out = f"results_depozitar_{re.sub(r'[^\\w]', '_', name)}.json"
                    scraper.export_json(results, out)

                    # print("Descarcare PDF-uri...")
                    # n = scraper.download_all(results)
                    # print(f"Descarcate: {n} fisiere in ./downloads/")

            case "4":

                all_results = []

                if legacy_name:
                    scraper.sources = ["legacy"]
                    all_results.extend(scraper.search(legacy_name))

                if modern_name:
                    scraper.sources = ["modern"]
                    all_results.extend(scraper.search(modern_name))

                if depozitar_name:
                    scraper.sources = ["depozitar"]
                    all_results.extend(scraper.search(depozitar_name))

                ANIScraper.print_results(all_results)

                if all_results:
                    scraper.export_json(all_results, "results_all.json")

                    # print("Descarcare PDF-uri...")
                    # n = scraper.download_all(all_results)
                    # print(f"Descarcate: {n} fisiere in ./downloads/")

    finally:
        if scraper.driver:
            scraper.driver.quit()

if __name__ == "__main__":
    main()