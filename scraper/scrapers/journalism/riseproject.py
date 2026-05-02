import re
import unicodedata
from html import unescape
from urllib.parse import quote_plus, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup


BASE_URL = "https://www.riseproject.ro"
SOURCE_NAME = "RiseProject"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

WP_ENDPOINTS = [
    "posts",
    "pages",
    "investigations",
    "projects",
    "video",
    "workshops",
]


def clean_text(text: str) -> str:
    return " ".join(unescape(text or "").split())


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return clean_text(text).lower()


def query_matches(text: str, query: str) -> bool:
    normalized_text = normalize_text(text)
    normalized_query = normalize_text(query)

    if normalized_query in normalized_text:
        return True

    words = [word for word in re.split(r"\W+", normalized_query) if len(word) > 2]
    return bool(words) and all(word in normalized_text for word in words)


def fetch_html(url: str) -> str | None:
    try:
        response = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
        response.raise_for_status()
        return response.text
    except httpx.HTTPError:
        return None


def fetch_json(url: str, params: dict | None = None) -> object | None:
    try:
        response = httpx.get(
            url,
            params=params,
            headers=HEADERS,
            timeout=15,
            follow_redirects=True,
        )
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError):
        return None


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


def is_sponsored_article(html: str) -> bool:
    html_lower = html.lower()

    sponsored_markers = [
        "advertorial",
        "articol sponsorizat",
        "conținut sponsorizat",
        "continut sponsorizat",
    ]

    return any(marker in html_lower for marker in sponsored_markers)


def is_valid_article_url(article_url: str) -> bool:
    parsed_url = urlparse(article_url)

    if parsed_url.netloc not in ["www.riseproject.ro", "riseproject.ro"]:
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

    return not any(part in parsed_url.path for part in invalid_parts)


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

        if isinstance(value, dict):
            rendered = value.get("rendered")
            if rendered:
                parts.append(clean_html_content(rendered))

        elif isinstance(value, str):
            parts.append(clean_html_content(value))

    return clean_text(" ".join(parts))


def extract_article_details_from_html(article_url: str) -> dict:
    html = fetch_html(article_url)

    if html is None:
        return {
            "title": None,
            "date": None,
            "text": None,
            "is_sponsored": False,
        }

    soup = BeautifulSoup(html, "lxml")

    title_tag = soup.find("h1")
    title = clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None

    date = None

    time_tag = soup.find("time")
    if time_tag:
        date = clean_text(time_tag.get_text(" ", strip=True))

    if date is None:
        meta_date = soup.find("meta", {"property": "article:published_time"})
        if meta_date and meta_date.get("content"):
            date = clean_text(meta_date["content"])

    article_container = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", class_="entry-content")
        or soup.find("div", class_="post-content")
        or soup
    )

    text = clean_html_content(str(article_container))

    return {
        "title": title,
        "date": date,
        "text": text,
        "is_sponsored": is_sponsored_article(html),
    }


def extract_article_details_from_api(item: dict) -> dict:
    title = extract_title_from_api(item)
    date = clean_text(item.get("date") or item.get("date_gmt") or "")
    text = extract_text_from_api(item)

    return {
        "title": title,
        "date": date or None,
        "text": text,
        "is_sponsored": False,
    }


def get_api_article_links(query: str) -> list[dict]:
    articles = []
    seen_urls = set()

    search_data = fetch_json(
        f"{BASE_URL}/wp-json/wp/v2/search",
        params={
            "search": query,
            "per_page": 20,
            "page": 1,
        },
    )

    if isinstance(search_data, list):
        for item in search_data:
            url = item.get("url")

            if not url or not is_valid_article_url(url):
                continue

            if url in seen_urls:
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
            params={
                "search": query,
                "per_page": 20,
                "page": 1,
            },
        )

        if not isinstance(data, list):
            continue

        for item in data:
            url = item.get("link") or item.get("url")

            if not url or not is_valid_article_url(url):
                continue

            if url in seen_urls:
                continue

            seen_urls.add(url)

            articles.append({
                "title": extract_title_from_api(item),
                "url": url,
                "api_item": item,
            })

    return articles


def get_html_article_links(query: str) -> list[dict]:
    html = fetch_html(build_search_url(query))

    if html is None:
        return []

    soup = BeautifulSoup(html, "lxml")
    articles = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        article_url = urljoin(BASE_URL, link["href"])

        if not is_valid_article_url(article_url):
            continue

        if article_url in seen_urls:
            continue

        seen_urls.add(article_url)

        title = clean_text(link.get_text(" ", strip=True))

        articles.append({
            "title": title or None,
            "url": article_url,
            "api_item": None,
        })

    return articles


def search(query: str, limit: int = 5) -> dict:
    article_links = get_api_article_links(query)

    if not article_links:
        article_links = get_html_article_links(query)

    results = []
    seen_urls = set()

    for article in article_links:
        article_url = article["url"]

        if article_url in seen_urls:
            continue

        seen_urls.add(article_url)

        details = None

        if article.get("api_item"):
            details = extract_article_details_from_api(article["api_item"])

        if not details or not details.get("text"):
            details = extract_article_details_from_html(article_url)

        if not details.get("text"):
            continue

        searchable_text = f"{details.get('title') or ''} {details.get('text') or ''}"

        if not query_matches(searchable_text, query):
            continue

        results.append({
            "source": SOURCE_NAME,
            "title": details.get("title") or article.get("title"),
            "url": article_url,
            "date": details.get("date"),
            "text": details.get("text"),
            "is_sponsored": details.get("is_sponsored", False),
        })

        if len(results) >= limit:
            break

    return {
        "source": SOURCE_NAME,
        "found": len(results) > 0,
        "results": results,
        "error": None,
    }


if __name__ == "__main__":
    import json

    data = search("Florin Salam", limit=5)
    print(json.dumps(data, ensure_ascii=False, indent=2))