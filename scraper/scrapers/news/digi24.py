from urllib.parse import quote_plus, urljoin

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.digi24.ro"
SOURCE_NAME = "Digi24"

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

    markers = [
        "articol susținut",
        "articol sponsorizat",
        "advertorial"
    ]

    return any(marker in html_lower for marker in markers)


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
    date_tag = soup.find("time")

    title = clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None
    date = clean_text(date_tag.get_text(" ", strip=True)) if date_tag else None

    paragraphs = []

    for p in soup.find_all("p"):
        text = clean_text(p.get_text(" ", strip=True))

        if len(text) < 40:
            continue

        if "Urmărește știrile Digi24.ro" in text:
            continue

        paragraphs.append(text)

    article_text = "\n".join(paragraphs)

    return {
        "title": title,
        "date": date,
        "text": article_text,
        "is_sponsored": is_sponsored_article(html)
    }


def build_search_url(query: str) -> str:
    return f"{BASE_URL}/cautare?q={quote_plus(query)}"


def search(query: str, limit: int = 5) -> dict:
    search_url = build_search_url(query)
    html = fetch_html(search_url)

    if html is None:
        return {
            "source": SOURCE_NAME,
            "found": False,
            "results": [],
            "error": "Could not fetch Digi24 search page"
        }

    soup = BeautifulSoup(html, "lxml")

    results = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        raw_title = clean_text(link.get_text(" ", strip=True))
        href = link["href"]

        if not raw_title:
            continue

        url = urljoin(BASE_URL, href)

        if "/stiri/" not in url:
            continue

        if len(raw_title) < 20:
            continue

        if url in seen_urls:
            continue

        seen_urls.add(url)

        details = extract_article_details(url)

        results.append({
            "source": SOURCE_NAME,
            "title": details["title"] or raw_title,
            "url": url,
            "date": details["date"],
            "text": details["text"],
            "is_sponsored": details["is_sponsored"]
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