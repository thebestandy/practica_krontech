#Profil Scraper via DuckDuckGO

# requirements
# ddgs
# -U ddgs
# -U ddgs[api]
# -U ddgs[mcp]

# duckduckgo-search
# -U duckduckgo-search

import json
import time
import random
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Lipsesc dependentele. Ruleaza:")
    print("pip install requests beautifulsoup4")
    sys.exit(1)


PLATFORMS = {
    "instagram": {
        "label": "Instagram",
        "emoji": "📸",
        "query_suffix": "site:instagram.com",
        "url_pattern": r"instagram\.com/[a-zA-Z0-9._]+/?$",
        "base_url": "instagram.com",
    },
    "linkedin": {
        "label": "LinkedIn",
        "emoji": "💼",
        "query_suffix": "site:linkedin.com/in",
        "url_pattern": r"linkedin\.com/in/[a-zA-Z0-9\-]+/?",
        "base_url": "linkedin.com",
    },
    "twitter": {
        "label": "Twitter/X",
        "emoji": "🐦",
        "query_suffix": "site:twitter.com OR site:x.com",
        "url_pattern": r"(twitter\.com|x\.com)/[a-zA-Z0-9_]+/?$",
        "base_url": "twitter.com / x.com",
    },
    "facebook": {
        "label": "Facebook",
        "emoji": "👤",
        "query_suffix": "site:facebook.com",
        "url_pattern": r"facebook\.com/[a-zA-Z0-9.]+/?$",
        "base_url": "facebook.com",
    },
    "tiktok": {
        "label": "TikTok",
        "emoji": "🎵",
        "query_suffix": "site:tiktok.com/@",
        "url_pattern": r"tiktok\.com/@[a-zA-Z0-9._]+/?",
        "base_url": "tiktok.com",
    },
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

OUTPUT_DIR = Path("./scraper/scrapers/duckduckgo")
OUTPUT_DIR.mkdir(exist_ok = True)


class DuckDuckGoScraper:

    DDG_URL = "https://html.duckduckgo.com/html/"

    def __init__(self):
        self.session = requests.Session()

    def _get_headers(self):
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://duckduckgo.com/",
            "DNT": "1",
            "Connection": "keep-alive",
        }

    def search(self, query: str, max_results: int = 5) -> list[dict]:
        try:
            time.sleep(random.uniform(1.5, 3.0))

            response = self.session.post(
                self.DDG_URL,
                data={"q": query, "b": "", "kl": "wt-wt"},
                headers = self._get_headers(),
                timeout = 15,
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            for result in soup.select(".result__body")[:max_results * 2]:
                title_el = result.select_one(".result__title a")
                snippet_el = result.select_one(".result__snippet")

                if not title_el:
                    continue

                url = title_el.get("href", "")
                if "uddg=" in url:
                    from urllib.parse import unquote, parse_qs
                    parsed = urlparse(url)
                    params = parse_qs(parsed.query)
                    url = params.get("uddg", [url])[0]
                    url = unquote(url)

                title = title_el.get_text(strip = True)
                snippet = snippet_el.get_text(strip = True) if snippet_el else ""

                if url and title:
                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                    })

                if len(results) >= max_results:
                    break

            return results

        except requests.RequestException as e:
            print(f"Eroare request DDG: {e}")
            return []
        except Exception as e:
            print(f"Eroare parsare DDG: {e}")
            return []



class ProfileFinder:
    def __init__(self):
        self.ddg = DuckDuckGoScraper()

    def _build_query(self, name: str, platform_key: str) -> str:
        platform = PLATFORMS[platform_key]
        return f'"{name}" {platform["query_suffix"]}'

    def _is_valid_profile_url(self, url: str, platform_key: str) -> bool:
        pattern = PLATFORMS[platform_key]["url_pattern"]

        exclude_keywords = [
            "/explore/", "/hashtag/", "/search", "/help/",
            "/about", "/privacy", "/terms", "/login", "/signup",
            "/p/", "/reel/", "/stories/", "/jobs/", "/company/",
            "?", "#",
        ]

        url_lower = url.lower()
        for kw in exclude_keywords:
            if kw in url_lower:
                return False

        return bool(re.search(pattern, url, re.IGNORECASE))

    def _extract_username(self, url: str, platform_key: str) -> str | None:
        try:
            parsed = urlparse(url)
            path = parsed.path.strip("/")
            parts = path.split("/")

            if platform_key == "linkedin":
                if "in" in parts:
                    idx = parts.index("in")
                    if idx + 1 < len(parts):
                        return parts[idx + 1]
            elif platform_key == "tiktok":
                for part in parts:
                    if part.startswith("@"):
                        return part
            else:
                if parts:
                    return parts[0]
        except Exception:
            pass
        return None

    def search_platform(self, name: str, platform_key: str) -> list[dict]:
        platform = PLATFORMS[platform_key]
        query = self._build_query(name, platform_key)

        print(f"{platform['emoji']} {platform['label']}: cauta...", end = "", flush = True)

        raw_results = self.ddg.search(query, max_results = 8)

        profiles = []
        seen_urls = set()

        for result in raw_results:
            url = result["url"]

            if url in seen_urls:
                continue

            if self._is_valid_profile_url(url, platform_key):
                username = self._extract_username(url, platform_key)
                profile = {
                    "platform": platform["label"],
                    "url": url,
                    "username": username,
                    "title": result["title"],
                    "snippet": result["snippet"],
                    "confidence": self._score_confidence(name, result, username),
                }
                profiles.append(profile)
                seen_urls.add(url)

        profiles.sort(key=lambda x: x["confidence"], reverse = True)

        print(f"{len(profiles)} gasite")
        return profiles

    def _score_confidence(self, name: str, result: dict, username: str | None) -> float:
        score = 0.5
        name_lower = name.lower()
        name_parts = name_lower.split()

        if username:
            u = username.lower().replace(".", "").replace("_", "").replace("-", "")
            name_clean = name_lower.replace(" ", "")
            if name_clean in u or u in name_clean:
                score += 0.3
            elif any(part in u for part in name_parts if len(part) > 2):
                score += 0.15

        title_lower = result["title"].lower()
        if name_lower in title_lower:
            score += 0.15
        elif all(part in title_lower for part in name_parts):
            score += 0.10

        snippet_lower = result["snippet"].lower()
        if name_lower in snippet_lower:
            score += 0.05

        return min(score, 1.0)

    def search_all(self, name: str) -> dict:
        print(f"\nCaut: \"{name}\"")
        print("─" * 50)

        all_results = {}
        total_found = 0

        for platform_key in PLATFORMS:
            results = self.search_platform(name, platform_key)
            all_results[platform_key] = results
            total_found += len(results)

            if platform_key != list(PLATFORMS.keys())[-1]:
                time.sleep(random.uniform(2.0, 4.0))

        print("─" * 50)
        print(f"Total: {total_found} profiluri gasite\n")

        return {
            "query": name,
            "searched_at": datetime.now().isoformat(),
            "total_found": total_found,
            "results": all_results,
        }


def save_results(data: dict) -> Path:
    safe_name = re.sub(r"[^\w\-]", "_", data["query"])
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = OUTPUT_DIR / f"{safe_name}_{timestamp}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii = False, indent = 2)

    return filename


def print_summary(data: dict):
    print("\nSUMMARY")
    print("=" * 50)

    for platform_key, profiles in data["results"].items():
        platform = PLATFORMS[platform_key]
        if not profiles:
            continue

        print(f"\n{platform['emoji']} {platform['label']}:")
        for i, p in enumerate(profiles, 1):
            confidence_bar = "█" * int(p["confidence"] * 5) + "░" * (5 - int(p["confidence"] * 5))
            username_display = f"@{p['username']}" if p["username"] else "?"
            print(f"{i}. {username_display}")
            print(f"{p['url']}")
            print(f"Confidence: [{confidence_bar}] {p['confidence']:.0%}")
            if p["snippet"]:
                snippet_short = p["snippet"][:80] + "..." if len(p["snippet"]) > 80 else p["snippet"]
                print(f"{snippet_short}")


def main():
    finder = ProfileFinder()

    while True:
        try:
            name = input("Introdu numele (sau 'exit'): ").strip()

            if not name:
                continue
            if name.lower() in ("exit", "quit", "q"):
                print("\nLa revedere!")
                break

            results = finder.search_all(name)

            print_summary(results)

            saved_path = save_results(results)
            print(f"\nSalvat: {saved_path}")

            print("\n" + "─" * 50 + "\n")

        except KeyboardInterrupt:
            print("\n\nLa revedere!")
            break
        except Exception as e:
            print(f"\nEroare neasteptata: {e}")
            continue


if __name__ == "__main__":
    main()