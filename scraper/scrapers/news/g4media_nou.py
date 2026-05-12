# G4Media.ro Scraper

import re
import time
import hashlib
import httpx
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus, urljoin, urlparse
from datetime import datetime

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.g4media.ro"
SOURCE_NAME = "G4Media"

HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 10
RETRIES = 3
REQUEST_DELAY = 0.25
MAX_WORKERS = 5


class G4MediaScraper:

    def __init__(self):
        self.session = httpx.Client(headers = HEADERS, timeout = TIMEOUT, follow_redirects = True)

    def request_get(self, url: str, **kwargs) -> httpx.Response | None:
        for attempt in range(RETRIES):
            try:
                time.sleep(REQUEST_DELAY)
                response = self.session.get(url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPError:
                if attempt == RETRIES - 1:
                    return None
        return None

    def fetch_html(self, url: str) -> str | None:
        response = self.request_get(url)
        return response.text if response else None

    def clean_text(self, text: str) -> str:
        text = " ".join((text or "").split())
        return re.sub(r"\s+([.,!?;:])", r"\1", text).strip()

    def clean_html_content(self, html: str) -> str:
        soup = BeautifulSoup(html or "", "lxml")

        for tag in soup(["script", "style", "noscript", "iframe", "form", "svg"]):
            tag.decompose()

        unwanted_fragments = [
            "Citește și",
            "Urmărește-ne pe",
            "Abonează-te",
            "Newsletter",
            "Facebook",
            "Twitter",
            "WhatsApp",
            "Publicitate",
            "Comentarii",
            "Politică de confidențialitate",
            "Politica de confidențialitate",
            "Cookie",
        ]

        paragraphs = []

        for paragraph in soup.find_all("p"):
            text = self.clean_text(paragraph.get_text(" ", strip = True))

            if len(text) < 40:
                continue

            if any(fragment.lower() in text.lower() for fragment in unwanted_fragments):
                continue

            paragraphs.append(text)

        return self.clean_text(" ".join(paragraphs))

    def normalize_date(self, value: str | None) -> str | None:
        value = self.clean_text(value or "")
        if not value:
            return None

        months = {
            "ianuarie": "01", "ian": "01", "january": "01", "jan": "01",
            "februarie": "02", "feb": "02", "february": "02",
            "martie": "03", "mar": "03", "march": "03",
            "aprilie": "04", "apr": "04", "april": "04",
            "mai": "05", "may": "05",
            "iunie": "06", "iun": "06", "june": "06", "jun": "06",
            "iulie": "07", "iul": "07", "july": "07", "jul": "07",
            "august": "08", "aug": "08",
            "septembrie": "09", "sep": "09", "sept": "09", "september": "09",
            "octombrie": "10", "oct": "10", "october": "10",
            "noiembrie": "11", "nov": "11", "november": "11",
            "decembrie": "12", "dec": "12", "december": "12",
        }

        iso_match = re.search(r"\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2})?", value)
        if iso_match:
            raw = iso_match.group(0).replace("T", " ")
            return raw[:16] if len(raw) >= 16 else raw

        numeric_match = re.search(
            r"(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\D+(\d{1,2}):(\d{2}))?",
            value,
        )
        if numeric_match:
            day, month, year, hour, minute = numeric_match.groups()
            if hour and minute:
                return f"{year}-{int(month):02d}-{int(day):02d} {int(hour):02d}:{minute}"
            return f"{year}-{int(month):02d}-{int(day):02d}"

        named_month_match = re.search(
            r"(\d{1,2})\s+([A-Za-zĂÂÎȘȚăâîșț]+)\s+(\d{4})(?:\D+(\d{1,2}):(\d{2}))?",
            value,
            flags = re.IGNORECASE,
        )
        if named_month_match:
            day, month_name, year, hour, minute = named_month_match.groups()
            month = months.get(month_name.lower())
            if month:
                if hour and minute:
                    return f"{year}-{month}-{int(day):02d} {int(hour):02d}:{minute}"
                return f"{year}-{month}-{int(day):02d}"

        try:
            parsed = parsedate_to_datetime(value)
            return parsed.strftime("%Y-%m-%d %H:%M")
        except Exception:
            pass

        return None

    def is_sponsored_article(self, html: str) -> bool:
        markers = [
            "advertorial",
            "articol sponsorizat",
            "conținut sponsorizat",
            "continut sponsorizat",
        ]
        html_lower = html.lower()
        return any(marker in html_lower for marker in markers)

    def is_valid_article_url(self, url: str) -> bool:
        parsed = urlparse(url)

        if "g4media.ro" not in parsed.netloc:
            return False

        invalid_parts = [
            "/cautare",
            "/tag/",
            "/video/",
            "/autor/",
            "/category/",
            "/politica-confidentialitate",
            "/termeni",
            "/contact",
            "/despre",
        ]

        if any(part in parsed.path for part in invalid_parts):
            return False

        # G4Media URLs: /YYYY/MM/DD/titlu sau /titlu-NNN
        return bool(re.search(r"/\d{4}/\d{2}/\d{2}/", parsed.path)) or bool(re.search(r"-\d+/?$", parsed.path))

    def build_search_url(self, query: str) -> str:
        return f"{BASE_URL}/?s={quote_plus(query)}"

    def extract_article_links(self, soup: BeautifulSoup) -> list[dict]:
        articles = []
        seen_urls = set()

        for link in soup.find_all("a", href = True):
            url = urljoin(BASE_URL, link["href"])

            if not self.is_valid_article_url(url):
                continue

            if url in seen_urls:
                continue

            title = self.clean_text(link.get_text(" ", strip = True))

            if len(title) < 20:
                parent = link.find_parent()
                title = self.clean_text(parent.get_text(" ", strip = True)) if parent else title

            if len(title) < 20:
                continue

            seen_urls.add(url)
            articles.append({"title": title, "url": url})

        return articles

    def extract_article_details(self, url: str) -> dict:
        html = self.fetch_html(url)

        if not html:
            return {"title": None, "date": None, "text": None, "is_sponsored": False}

        soup = BeautifulSoup(html, "lxml")

        title_tag = soup.find("h1")
        date = None

        time_tag = soup.find("time")
        if time_tag:
            date = time_tag.get("datetime") or time_tag.get_text(" ", strip = True)

        if not date:
            meta_date = soup.find("meta", {"property": "article:published_time"})
            if meta_date and meta_date.get("content"):
                date = meta_date["content"]

        if not date:
            meta_og = soup.find("meta", {"property": "og:updated_time"})
            if meta_og and meta_og.get("content"):
                date = meta_og["content"]

        return {
            "title": self.clean_text(title_tag.get_text(" ", strip = True)) if title_tag else None,
            "date": self.normalize_date(date),
            "text": self.clean_html_content(html),
            "is_sponsored": self.is_sponsored_article(html),
        }

    def search(self, target: str, limit: int = 5) -> dict:
        article_links = []

        html = self.fetch_html(self.build_search_url(target))

        if html:
            soup = BeautifulSoup(html, "lxml")
            article_links = self.extract_article_links(soup)

        graph_nodes = []

        with ThreadPoolExecutor(max_workers = min(MAX_WORKERS, max(1, len(article_links)))) as executor:
            for article_link, details in zip(
                article_links,
                executor.map(lambda item: self.extract_article_details(item["url"]), article_links),
            ):
                if not details["text"] or details["is_sponsored"]:
                    continue

                article_id = hashlib.md5(article_link["url"].encode()).hexdigest()
                graph_nodes.append({
                    "id": f"doc_{article_id}",
                    "type": "Document",
                    "label": details["title"] or article_link["title"],
                    "summary": details["date"] or "Data necunoscuta",
                    "url": article_link["url"],
                    "text": details["text"],
                })

                if len(graph_nodes) >= limit:
                    break

        return {
            "source": "g4media scraper",
            "type": "document",
            "certainty": "0",
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": SOURCE_NAME,
                "count": len(graph_nodes),
            },
            "nodes": graph_nodes,
        }

# le-am lasat comentate
# if __name__ == "__main__":
#     import json
#     scraper = G4MediaScraper()
#     print(json.dumps(scraper.search("Romania", limit=5), ensure_ascii=False, indent=2))