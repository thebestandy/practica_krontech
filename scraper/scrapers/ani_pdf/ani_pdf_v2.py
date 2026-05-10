import re
import json
import logging
import requests
import hashlib
from bs4 import BeautifulSoup
from dataclasses import dataclass, field
from typing import List
from datetime import datetime

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ani_legacy_scraper")


@dataclass
class DeclarationPDF:
    title: str
    year: str
    type: str
    url: str
    unique_id: str
    source: str = "legacy"


@dataclass
class PersonResult:
    name: str
    institution: str
    position: str = ""
    pdfs: List[DeclarationPDF] = field(default_factory=list)


class LegacyScraper:
    BASE_URL = "https://old-declaratii.integritate.eu"
    SEARCH_ENDPOINT = f"{BASE_URL}/index.html"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": self.BASE_URL,
            }
        )

    def _extract_metadata(self, text: str):
        year_match = re.search(r"\b(20\d{2})\b", text)
        year = year_match.group(1) if year_match else ""

        t = text.lower()
        doc_type = (
            "avere" if "avere" in t else "interese" if "interese" in t else "unknown"
        )

        return year, doc_type

    def _get_uid(self, url: str) -> str:
        for param in ("uniqueIdentifier=", "fileName="):
            if param in url:
                return url.split(param)[1].split("&")[0]
        return url.split("/")[-1]

    def search(self, name: str):
        log.info(f"Searching Legacy Portal for: {name}")

        # The Legacy site uses JSF (JavaServer Faces), which requires a VIEWSTATE
        # We fetch the page once to get the necessary session cookies and form tokens
        try:
            initial_resp = self.session.get(self.SEARCH_ENDPOINT)
            soup = BeautifulSoup(initial_resp.text, "lxml")
            view_state = soup.find("input", {"name": "javax.faces.ViewState"})["value"]

            # Prepare the form data to mimic the search button click
            payload = {
                "form": "form",
                "form:searchKey_input": name,
                "form:searchField_input": "numePrenume",
                "form:submitButtonSS": "Caută",
                "javax.faces.ViewState": view_state,
            }

            response = self.session.post(self.SEARCH_ENDPOINT, data=payload)
            return self._parse_results(response.text)

        except Exception as e:
            log.error(f"Request failed: {e}")
            return []

    def _parse_results(self, html: str):
        soup = BeautifulSoup(html, "lxml")
        results = []
        seen_uids = set()

        # Look for all table rows
        all_rows = soup.find_all("tr")

        # Filter for rows that actually contain a download link
        # This bypasses headers and footer garbage automatically
        data_rows = [
            row
            for row in all_rows
            if row.find("a", href=re.compile(r"DownloadServlet"))
        ]

        log.info(f"Analyzing {len(data_rows)} filtered data rows.")

        for row in data_rows:
            cells = row.find_all("td")

            # The Legacy portal usually has 9 columns in the result table
            if len(cells) < 8:
                continue

            # Standard Legacy Column Mapping:
            # 0: Name, 1: Institution, 2: Position, 3: Locality,
            # 4: County, 5: Date, 6: Type, 7: Link
            name = cells[0].get_text(strip=True)
            inst = cells[1].get_text(strip=True)
            pos = cells[2].get_text(strip=True)
            date_str = cells[5].get_text(strip=True)
            doc_type_raw = cells[6].get_text(strip=True)

            a = cells[7].find("a", href=re.compile(r"DownloadServlet"))
            if not a:
                continue

            href = a.get("href", "")
            if href.startswith("/"):
                href = self.BASE_URL + href

            uid = self._get_uid(href)

            if uid in seen_uids:
                continue
            seen_uids.add(uid)

            year = date_str.split(".")[-1] if "." in date_str else ""
            doc_type = "avere" if "avere" in doc_type_raw.lower() else "interese"

            # Check if we already have this person to group their PDFs
            existing_person = next(
                (p for p in results if p.name == name and p.institution == inst), None
            )

            new_pdf = DeclarationPDF(
                title=f"{doc_type_raw} ({date_str})",
                year=year,
                type=doc_type,
                url=href,
                unique_id=uid,
            )

            if existing_person:
                existing_person.pdfs.append(new_pdf)
            else:
                results.append(
                    PersonResult(
                        name=name, institution=inst, position=pos, pdfs=[new_pdf]
                    )
                )

        # de aici am modifica ce returneaza
        graph_nodes = []
        for person in results:
            person_id = hashlib.md5(
                f"{person.name}_{person.institution}".encode()
            ).hexdigest()

            summary_parts = [p for p in (person.position, person.institution) if p]
            person_summary = (
                " at ".join(summary_parts) if summary_parts else "unknown institush"
            )

            # bih ahh schema
            graph_nodes.append(
                {
                    "id": f"person_{person_id}",
                    "type": "Person",
                    "label": person.name,
                    "summary": person_summary,
                    "url": "N/A",
                }
            )

            for pdf in person.pdfs:
                graph_nodes.append(
                    {
                        "id": f"doc_{pdf.unique_id}",
                        "type": "Document",
                        "label": f"Delcarash de {pdf.type.capitalize()} ({pdf.year})",
                        "summary": f"Document associash with {person.name}",
                        "url": pdf.url,
                    }
                )

        res = {
            "source": "ani scraper",
            "type": "document",
            "certainty": "0",
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": "ANI Legacy Portal",
                "count": len(graph_nodes),
            },
            "nodes": graph_nodes,
        }

        return res


# le-am lasat comentate
# def export_to_json(results: List[PersonResult], filename: str):
#     output = {
#         "metadata": {
#             "timestamp": datetime.now().isoformat(),
#             "source": "ANI Legacy Portal",
#             "count": len(results)
#         },
#         "data": [r.to_dict() for r in results]
#     }
#     with open(filename, "w", encoding="utf-8") as f:
#         json.dump(output, f, ensure_ascii=False, indent=4)
#     log.info(f"JSON exported to {filename}")
#
# if __name__ == "__main__":
#     search_name = input("Enter name to search: ").strip()
#     if search_name:
#         scraper = LegacyScraper()
#         data = scraper.search(search_name)
#
#         if data:
#             export_to_json(data, f"ani_{search_name.replace(' ', '_')}.json")
#         else:
#             print("No results found.")
