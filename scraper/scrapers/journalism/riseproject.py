import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime
from html import unescape
from urllib.parse import quote_plus, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.riseproject.ro"
SOURCE_NAME = "RiseProject"

HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 15
RETRIES = 3
REQUEST_DELAY = 0.25
MAX_WORKERS = 5

WP_ENDPOINTS = [
    "posts",
    "pages",
    "investigations",
    "projects",
    "video",
    "workshops",
]


def request_get(url: str, **kwargs) -> httpx.Response | None:
    for attempt in range(RETRIES):
        try:
            time.sleep(REQUEST_DELAY)
            response = httpx.get(
                url,
                headers=HEADERS,
                timeout=TIMEOUT,
                follow_redirects=True,
                **kwargs,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPError:
            if attempt == RETRIES - 1:
                return None
    return None


def fetch_html(url: str) -> str | None:
    response = request_get(url)
    return response.text if response else None


def fetch_json(url: str, params: dict | None = None) -> object | None:
    response = request_get(url, params=params)
    if not response:
        return None

    try:
        return response.json()
    except ValueError:
        return None


def clean_text(text: str) -> str:
    text = unescape(text or "")
    text = " ".join(text.split())
    return re.sub(r"\s+([.,!?;:])", r"\1", text).strip()


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(char for char in text if not unicodedata.combining(char))
    return clean_text(text).lower()


def query_matches(text: str, query: str) -> bool:
    normalized_text = normalize_text(text)
    normalized_query = normalize_text(query)

    if normalized_query in normalized_text:
        return True

    words = [word for word in re.split(r"\W+", normalized_query) if len(word) > 2]
    return bool(words) and all(word in normalized_text for word in words)


def clean_html_content(html: str) -> str:
    soup = BeautifulSoup(html or "", "lxml")

    for tag in soup(["script", "style", "noscript", "iframe", "form", "svg"]):
        tag.decompose()

    unwanted_fragments = [
        "Donează",
        "Susține RISE Project",
        "Sustine RISE Project",
        "Abonează-te",
        "Aboneaza-te",
        "Newsletter",
        "Facebook",
        "Twitter",
        "Instagram",
        "Citește și",
        "Citeste si",
        "Distribuie",
        "Comentarii",
        "Politica de confidențialitate",
        "Politica de confidentialitate",
        "Cookie",
        "GDPR",
    ]

    paragraphs = []

    for paragraph in soup.find_all(["p", "li"]):
        text = clean_text(paragraph.get_text(" ", strip=True))

        if len(text) < 40:
            continue

        if any(fragment.lower() in text.lower() for fragment in unwanted_fragments):
            continue

        paragraphs.append(text)

    if paragraphs:
        return clean_text(" ".join(paragraphs))

    return clean_text(soup.get_text(" ", strip=True))


def normalize_date(value: str | None) -> str | None:
    value = clean_text(value or "")
    value = value.replace("Publicat:", "").replace("Actualizat:", "").strip()

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
        flags=re.IGNORECASE,
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
        return value


def is_sponsored_article(html: str) -> bool:
    markers = [
        "advertorial",
        "articol sponsorizat",
        "conținut sponsorizat",
        "continut sponsorizat",
    ]
    html_lower = html.lower()
    return any(marker in html_lower for marker in markers)


def is_valid_article_url(url: str) -> bool:
    parsed = urlparse(url)

    if parsed.netloc not in ["www.riseproject.ro", "riseproject.ro"]:
        return False

    invalid_parts = [
        "/tag/",
        "/author/",
        "/category/",
        "/wp-content/",
        "/wp-json/",
        "/contact",
        "/despre-noi",
        "/privacy",
        "/politica",
        "#",
    ]

    return not any(part in parsed.path for part in invalid_parts)


def build_search_url(query: str) -> str:
    return f"{BASE_URL}/?s={quote_plus(query)}"


def extract_title_from_api(item: dict) -> str | None:
    title = item.get("title")

    if isinstance(title, dict):
        return clean_text(title.get("rendered"))

    if isinstance(title, str):
        return clean_text(title)

    return None


def extract_text_from_api(item: dict) -> str:
    parts = []

    for field in ["content", "excerpt"]:
        value = item.get(field)

        if isinstance(value, dict) and value.get("rendered"):
            parts.append(clean_html_content(value["rendered"]))
        elif isinstance(value, str):
            parts.append(clean_html_content(value))

    return clean_text(" ".join(parts))


def extract_article_links_from_api(query: str) -> list[dict]:
    articles = []
    seen_urls = set()

    search_data = fetch_json(
        f"{BASE_URL}/wp-json/wp/v2/search",
        params={"search": query, "per_page": 20, "page": 1},
    )

    if isinstance(search_data, list):
        for item in search_data:
            url = item.get("url")

            if not url or not is_valid_article_url(url) or url in seen_urls:
                continue

            seen_urls.add(url)
            articles.append({
                "title": clean_text(item.get("title")),
                "url": url,
                "api_item": None,
            })

    for endpoint in WP_ENDPOINTS:
        data = fetch_json(
            f"{BASE_URL}/wp-json/wp/v2/{endpoint}",
            params={"search": query, "per_page": 20, "page": 1},
        )

        if not isinstance(data, list):
            continue

        for item in data:
            url = item.get("link") or item.get("url")

            if not url or not is_valid_article_url(url) or url in seen_urls:
                continue

            seen_urls.add(url)
            articles.append({
                "title": extract_title_from_api(item),
                "url": url,
                "api_item": item,
            })

    return articles


def extract_article_links_from_html(query: str) -> list[dict]:
    html = fetch_html(build_search_url(query))

    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    articles = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        url = urljoin(BASE_URL, link["href"])

        if not is_valid_article_url(url) or url in seen_urls:
            continue

        title = clean_text(link.get_text(" ", strip=True))

        if not title or len(title) < 30:
            continue

        seen_urls.add(url)
        articles.append({
            "title": title,
            "url": url,
            "api_item": None,
        })

    return articles


def extract_article_links(query: str) -> list[dict]:
    articles = extract_article_links_from_api(query)

    if articles:
        return articles

    return extract_article_links_from_html(query)


def extract_article_details_from_api(item: dict) -> dict:
    return {
        "title": extract_title_from_api(item),
        "date": normalize_date(item.get("date") or item.get("date_gmt")),
        "text": extract_text_from_api(item),
        "is_sponsored": False,
    }


def extract_article_details_from_html(url: str) -> dict:
    html = fetch_html(url)

    if not html:
        return {"title": None, "date": None, "text": None, "is_sponsored": False}

    soup = BeautifulSoup(html, "lxml")

    title_tag = soup.find("h1")
    time_tag = soup.find("time")
    meta_date = soup.find("meta", {"property": "article:published_time"})

    article_container = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", class_="entry-content")
        or soup.find("div", class_="post-content")
        or soup
    )

    date = time_tag.get_text(" ", strip=True) if time_tag else None

    if not date and meta_date and meta_date.get("content"):
        date = meta_date["content"]

    return {
        "title": clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None,
        "date": normalize_date(date),
        "text": clean_html_content(str(article_container)),
        "is_sponsored": is_sponsored_article(html),
    }


def extract_article_details(article: dict) -> dict:
    details = None

    if article.get("api_item"):
        details = extract_article_details_from_api(article["api_item"])

    if not details or not details.get("text"):
        details = extract_article_details_from_html(article["url"])

    return details


def search(query: str, limit: int = 5) -> dict:
    article_links = extract_article_links(query)
    results = []
    seen_urls = set()

    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, max(1, len(article_links)))) as executor:
        for article, details in zip(article_links, executor.map(extract_article_details, article_links)):
            url = article["url"]

            if url in seen_urls:
                continue

            seen_urls.add(url)

            if not details.get("text"):
                continue

            searchable_text = f"{details.get('title') or ''} {details.get('text') or ''}"

            if not query_matches(searchable_text, query):
                continue

            results.append({
                "source": SOURCE_NAME,
                "title": details.get("title") or article.get("title"),
                "url": url,
                "date": details.get("date"),
                "text": details.get("text"),
                "is_sponsored": details.get("is_sponsored", False),
            })

            if len(results) >= limit:
                break

    return {
        "source": SOURCE_NAME,
        "found": bool(results),
        "results": results,
        "error": None,
    }


if __name__ == "__main__":
    import json

    print(json.dumps(search("Romania", limit=5), ensure_ascii=False, indent=2))