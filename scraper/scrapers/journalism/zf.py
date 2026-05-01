import re
from urllib.parse import quote_plus, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.zf.ro"
SOURCE_NAME = "ZF"

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
    title = clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None

    date = None

    time_tag = soup.find("time")
    if time_tag:
        date = clean_text(time_tag.get_text(" ", strip=True))

    meta_date = soup.find("meta", {"property": "article:published_time"})
    if date is None and meta_date and meta_date.get("content"):
        date = clean_text(meta_date["content"])

    article_container = (
        soup.find("div", class_="text")
        or soup.find("div", class_="article_content")
        or soup.find("div", class_="articleContent")
        or soup.find("article")
        or soup
    )

    unwanted_fragments = [
        "Tweet",
        "Urmărește",
        "Print",
        "Mail",
        "Setări cookies",
        "Politica de confidențialitate",
        "Politica de cookies",
        "Termeni și condiții",
        "ABONEAZĂ-TE",
        "Abonează-te",
        "Preluarea fără cost a materialelor",
        "ZF Corporate",
        "Ziarul Financiar",
    ]

    paragraphs = []

    for paragraph in article_container.find_all("p"):
        paragraph_text = clean_text(paragraph.get_text(" ", strip=True))

        if len(paragraph_text) < 40:
            continue

        if any(fragment in paragraph_text for fragment in unwanted_fragments):
            continue

        paragraphs.append(paragraph_text)

    article_text = clean_text(" ".join(paragraphs))

    cutoff_markers = [
    "Ce arată primele date pe 2025:",
    "Bursă. OMV Petrom",
    "CEC Bank pentru afaceri româneşti:",
    ]

    for marker in cutoff_markers:
        if marker in article_text:
            article_text = article_text.split(marker)[0].strip()
            break

    return {
        "title": title,
        "date": date,
        "text": article_text,
        "is_sponsored": is_sponsored_article(html)
    }


def build_search_url(query: str) -> str:
    return f"{BASE_URL}/search?q={quote_plus(query)}"


def is_valid_article_url(article_url: str) -> bool:
    parsed_url = urlparse(article_url)

    if parsed_url.netloc not in ["www.zf.ro", "zf.ro"]:
        return False

    path = parsed_url.path

    invalid_url_parts = [
        "/search",
        "/contact",
        "/termeni",
        "/politica",
        "/publicitate",
        "/abonamente",
        "/tags/",
        "/autor/",
        "#",
    ]

    if any(part in path for part in invalid_url_parts):
        return False

    return bool(re.search(r"-\d+$", path))


def extract_article_links_from_page(soup: BeautifulSoup) -> list[dict]:
    articles = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        raw_href = link["href"]
        article_url = urljoin(BASE_URL, raw_href)

        if not is_valid_article_url(article_url):
            continue

        if article_url in seen_urls:
            continue

        raw_title = clean_text(link.get_text(" ", strip=True))

        if len(raw_title) < 20:
            parent = link.find_parent()
            raw_title = clean_text(parent.get_text(" ", strip=True)) if parent else raw_title

        if len(raw_title) < 20:
            continue

        seen_urls.add(article_url)

        articles.append({
            "title": raw_title,
            "url": article_url
        })

    return articles


def search(query: str, limit: int = 5) -> dict:
    search_url = build_search_url(query)
    html = fetch_html(search_url)

    if html is None:
        return {
            "source": SOURCE_NAME,
            "found": False,
            "results": [],
            "error": "Could not fetch ZF search page"
        }

    soup = BeautifulSoup(html, "lxml")
    article_links = extract_article_links_from_page(soup)

    results = []
    seen_urls = set()

    for article_link in article_links:
        article_url = article_link["url"]

        if article_url in seen_urls:
            continue

        seen_urls.add(article_url)

        article_details = extract_article_details(article_url)

        if not article_details["text"]:
            continue

        results.append({
            "source": SOURCE_NAME,
            "title": article_details["title"] or article_link["title"],
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

    data = search("frauda", limit=5)
    print(json.dumps(data, ensure_ascii=False, indent=2))