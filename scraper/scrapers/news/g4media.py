from urllib.parse import quote_plus, urljoin

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.g4media.ro"
SOURCE_NAME = "G4Media"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


def fetch_html(url: str) -> str | None:
    try:
        response = httpx.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.text
    except httpx.HTTPError:
        return None


def clean_text(text: str) -> str:
    return " ".join(text.split())


def is_sponsored_article(html: str) -> bool:
    html_lower = html.lower()

    sponsored_markers = [
        "advertorial",
        "articol susținut",
        "articol sponsorizat",
        "conținut sponsorizat",
        "continut sponsorizat",
    ]

    return any(marker in html_lower for marker in sponsored_markers)


def extract_article_details(article_url: str) -> dict:
    html = fetch_html(article_url)

    if html is None:
        return {
            "title": None,
            "date": None,
            "text": None,
            "is_sponsored": False
        }

    soup = BeautifulSoup(html, "lxml")

    title_tag = soup.find("h1")
    time_tag = soup.find("time")

    title = clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None

    date = None

    if time_tag:
        date = clean_text(time_tag.get_text(" ", strip=True))

    if date is None:
        meta_date = soup.find("meta", {"property": "article:published_time"})

        if meta_date and meta_date.get("content"):
            date = clean_text(meta_date["content"])

    unwanted_fragments = [
        "Funcționăm ca organizație non-profit",
        "Citește și:",
        "Vezi și:",
        "Abonează-te",
        "Newsletter",
        "Distribuie",
        "Facebook",
        "Twitter",
        "WhatsApp",
    ]

    paragraphs = []

    for paragraph in soup.find_all("p"):
        paragraph_text = clean_text(paragraph.get_text(" ", strip=True))

        if len(paragraph_text) < 40:
            continue

        if any(fragment in paragraph_text for fragment in unwanted_fragments):
            continue

        paragraphs.append(paragraph_text)

    article_text = clean_text(" ".join(paragraphs))

    return {
        "title": title,
        "date": date,
        "text": article_text,
        "is_sponsored": is_sponsored_article(html)
    }


def build_search_url(query: str) -> str:
    return f"{BASE_URL}/?s={quote_plus(query)}"


def is_valid_article_url(article_url: str) -> bool:
    if not article_url.startswith(BASE_URL):
        return False

    if not article_url.endswith(".html"):
        return False

    invalid_url_parts = [
        "/tag/",
        "/category/",
        "/video/",
        "#",
    ]

    return not any(part in article_url for part in invalid_url_parts)


def search(query: str, limit: int = 5) -> dict:
    search_url = build_search_url(query)
    html = fetch_html(search_url)

    if html is None:
        return {
            "source": SOURCE_NAME,
            "found": False,
            "results": [],
            "error": "Could not fetch G4Media search page"
        }

    soup = BeautifulSoup(html, "lxml")

    results = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        raw_title = clean_text(link.get_text(" ", strip=True))
        raw_href = link["href"]

        if not raw_title:
            continue

        article_url = urljoin(BASE_URL, raw_href)

        if len(raw_title) < 20:
            continue

        if not is_valid_article_url(article_url):
            continue

        if article_url in seen_urls:
            continue

        seen_urls.add(article_url)

        article_details = extract_article_details(article_url)

        if not article_details["text"]:
            continue

        results.append({
            "source": SOURCE_NAME,
            "title": article_details["title"] or raw_title,
            "url": article_url,
            "date": article_details["date"],
            "text": article_details["text"],
            "is_sponsored": article_details["is_sponsored"]
        })

        if len(results) >= limit:
            break

    return {
        "source": SOURCE_NAME,
        "found": len(results) > 0,
        "results": results,
        "error": None
    }


if __name__ == "__main__":
    import json

    data = search("Romania", limit=5)
    print(json.dumps(data, ensure_ascii=False, indent=2))