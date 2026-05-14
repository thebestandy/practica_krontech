# Profile Scraper via DuckDuckGo - Selenium Headless

import json
import time
import random
import re
import hashlib
import logging
from dataclasses import dataclass, field
from typing import List, Optional
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
from bs4 import BeautifulSoup

logging.basicConfig(
    level = logging.INFO,
    format = "%(asctime)s [%(levelname)s] %(message)s",
    datefmt = "%H:%M:%S",
)
log = logging.getLogger("profile_scraper")


PLATFORMS = {
    "instagram": {
        "label": "Instagram",
        "emoji": "📸",
        "query_template": '"{name}" site:instagram.com',
        "url_pattern": r"instagram\.com/([a-zA-Z0-9._]+)/?$",
        "exclude_paths": ["/p/", "/reel/", "/stories/", "/explore/", "/hashtag/", "/tv/"],
    },
    "linkedin": {
        "label": "LinkedIn",
        "emoji": "💼",
        "query_template": '"{name}" linkedin profile',
        "url_pattern": r"linkedin\.com/in/([a-zA-Z0-9\-_%]+)/?",
        "exclude_paths": ["/jobs/", "/company/", "/school/", "/groups/", "/pulse/", "/posts/"],
    },
    "twitter": {
        "label": "Twitter/X",
        "emoji": "🐦",
        "query_template": '"{name}" site:twitter.com OR site:x.com',
        "url_pattern": r"(?:twitter|x)\.com/([a-zA-Z0-9_]+)/?$",
        "exclude_paths": ["/search", "/hashtag/", "/i/", "/home", "/explore", "/notifications"],
    },
    "facebook": {
        "label": "Facebook",
        "emoji": "👤",
        "query_template": '"{name}" site:facebook.com',
        "url_pattern": r"facebook\.com/([a-zA-Z0-9.]+)/?$",
        "exclude_paths": ["/groups/", "/pages/", "/events/", "/marketplace/", "/watch/", "/photo"],
    },
    "tiktok": {
        "label": "TikTok",
        "emoji": "🎵",
        "query_template": '"{name}" site:tiktok.com',
        "url_pattern": r"tiktok\.com/@([a-zA-Z0-9._]+)/?",
        "exclude_paths": ["/video/", "/tag/", "/music/", "/discover"],
    },
}

OUTPUT_DIR = Path("./scraper/scrapers/duckduckgo/downloads")
OUTPUT_DIR.mkdir(parents = True, exist_ok = True)

DDG_URL = "https://duckduckgo.com/"


@dataclass
class ProfileResult:
    platform: str
    platform_key: str
    url: str
    username: Optional[str]
    title: str
    snippet: str
    confidence: float


def _build_driver(headless: bool = True) -> webdriver.Chrome:
    opts = Options()

    if headless:
        opts.add_argument("--headless=new")

    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1280,900")

    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    return webdriver.Chrome(options = opts)


def _is_valid_profile_url(url: str, platform_key: str) -> bool:
    cfg = PLATFORMS[platform_key]
    parsed = urlparse(url)

    if parsed.query or parsed.fragment:
        return False

    url_lower = url.lower()
    for ep in cfg.get("exclude_paths", []):
        if ep in url_lower:
            return False

    return bool(re.search(cfg["url_pattern"], url, re.IGNORECASE))


def _extract_username(url: str, platform_key: str) -> Optional[str]:
    match = re.search(PLATFORMS[platform_key]["url_pattern"], url, re.IGNORECASE)
    return match.group(1) if match else None


def _confidence_score(name: str, title: str, snippet: str, username: Optional[str]) -> float:
    score = 0.4
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 2]
    name_compact = re.sub(r"[^a-z0-9]", "", name_lower)

    if username:
        u = re.sub(r"[^a-z0-9]", "", username.lower())
        if name_compact in u or u in name_compact:
            score += 0.35
        elif any(part in u for part in name_parts):
            score += 0.20

    t = title.lower()
    if name_lower in t:
        score += 0.15
    elif all(p in t for p in name_parts):
        score += 0.10

    if name_lower in snippet.lower():
        score += 0.05

    return min(round(score, 2), 1.0)


class _DDGScraper:

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.delay = delay

    def search(self, query: str, max_results: int = 8) -> List[dict]:
        log.info(f"[DDG] Query: {query!r}")
        try:
            self.driver.get(DDG_URL)
            time.sleep(self.delay)

            box = self._find_search_box()
            if not box:
                log.warning("[DDG] Search box negasit.")
                return []

            box.clear()
            time.sleep(0.3)

            for char in query:
                box.send_keys(char)
                time.sleep(random.uniform(0.03, 0.09))

            time.sleep(random.uniform(0.5, 1.0))
            box.send_keys(Keys.RETURN)
            time.sleep(self.delay + random.uniform(1.0, 2.0))

            return self._parse_results(max_results)

        except Exception as e:
            log.error(f"[DDG] Eroare: {e}")
            return []

    def _find_search_box(self):
        for by, sel in [
            (By.NAME, "q"),
            (By.CSS_SELECTOR, "input[type='search']"),
            (By.CSS_SELECTOR, "#searchbox_input"),
            (By.CSS_SELECTOR, "input[type='text']"),
        ]:
            try:
                el = self.driver.find_element(by, sel)
                if el.is_displayed():
                    return el
            except NoSuchElementException:
                continue
        return None

    def _parse_results(self, max_results: int) -> List[dict]:
        soup = BeautifulSoup(self.driver.page_source, "lxml")
        results = []

        articles = (
            soup.select("article[data-testid='result']")
            or soup.select("li[data-layout='organic']")
            or soup.select(".result")
        )

        log.info(f"[DDG] Elemente HTML gasite: {len(articles)}")

        for art in articles[:max_results * 2]:
            try:
                link = art.select_one(
                    "a[data-testid='result-title-a'], h2 a, .result__title a"
                )
                if not link:
                    continue

                url = link.get("href", "")
                if not url or "duckduckgo.com" in url:
                    continue

                title = link.get_text(strip=True)

                snippet_el = art.select_one(
                    "[data-result='snippet'], .result__snippet, "
                    "span[class*='snippet'], div[class*='snippet']"
                )
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                if url and title:
                    results.append({"url": url, "title": title, "snippet": snippet})

                if len(results) >= max_results:
                    break

            except Exception as e:
                log.debug(f"[DDG] Eroare element: {e}")

        log.info(f"[DDG] Rezultate extrase: {len(results)}")
        return results


class _ProfileFinder:

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.ddg = _DDGScraper(driver, delay)
        self.delay = delay

    def search_platform(self, name: str, platform_key: str) -> List[ProfileResult]:
        cfg = PLATFORMS[platform_key]
        query = cfg["query_template"].format(name=name)

        raw = self.ddg.search(query, max_results=8)

        profiles = []
        seen = set()

        for r in raw:
            url = r.get("url", "")
            if not url or url in seen:
                continue

            if _is_valid_profile_url(url, platform_key):
                username = _extract_username(url, platform_key)
                score = _confidence_score(
                    name, r.get("title", ""), r.get("snippet", ""), username
                )
                profiles.append(ProfileResult(
                    platform = cfg["label"],
                    platform_key = platform_key,
                    url = url,
                    username = username,
                    title = r.get("title", ""),
                    snippet = r.get("snippet", ""),
                    confidence = score,
                ))
                seen.add(url)

        profiles.sort(key=lambda x: x.confidence, reverse=True)
        return profiles[:3]

    def search_all(self, name: str) -> List[ProfileResult]:
        all_profiles: List[ProfileResult] = []

        for i, platform_key in enumerate(PLATFORMS):
            log.info(f"[{PLATFORMS[platform_key]['label']}] cautare...")
            results = self.search_platform(name, platform_key)
            all_profiles.extend(results)
            log.info(f"[{PLATFORMS[platform_key]['label']}] {len(results)} gasite")

            if i < len(PLATFORMS) - 1:
                time.sleep(random.uniform(2.0, 4.0))

        return all_profiles


def _build_output(name: str, profiles: List[ProfileResult]) -> dict:

    nodes = []

    for p in profiles:
        uid = hashlib.md5(p.url.encode()).hexdigest()
        username_display = f"@{p.username}" if p.username else p.url.split("/")[-1]

        nodes.append({
            "id": f"profile_{uid}",
            "type": "SocialProfile",
            "label": username_display,
            "summary": f"{p.platform} profile for {name} | confidence {p.confidence:.0%}",
            "url": p.url,
            "platform": p.platform,
            "username": p.username,
            "title": p.title,
            "snippet": p.snippet,
            "confidence": p.confidence,
        })

    return {
        "source": "profile scraper",
        "type": "social_profile",
        "certainty": str(round(max((p.confidence for p in profiles), default = 0), 2)),
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "source": "DuckDuckGo (Selenium)",
            "query": name,
            "count": len(nodes),
            "platforms_searched": list(PLATFORMS.keys()),
        },
        "nodes": nodes,
    }


class ProfileScraper:

    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.headless = headless
        self.delay = delay
        self.driver: Optional[webdriver.Chrome] = None

    def __enter__(self):
        self.driver = _build_driver(self.headless)
        return self

    def __exit__(self, *_):
        self._quit()

    def _quit(self):
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

    def search(self, name: str) -> dict:
        driver_created_here = False

        try:
            if not self.driver:
                self.driver = _build_driver(self.headless)
                driver_created_here = True

            finder = _ProfileFinder(self.driver, self.delay)
            profiles = finder.search_all(name)
            result = _build_output(name, profiles)

            log.info(
                f"[ProfileScraper] '{name}' -> {len(profiles)} profiluri gasite"
            )
            return result

        except Exception as e:
            log.error(f"[ProfileScraper] Eroare: {e}")
            return _build_output(name, [])

        finally:
            if driver_created_here:
                self._quit()


# def _print_summary(result: dict):
#     nodes = result.get("nodes", [])
#     print(f"\nSUMMARY — {len(nodes)} profiluri gasite")
#     print("=" * 55)

#     by_platform: dict = {}
#     for node in nodes:
#         plat = node.get("platform", "?")
#         by_platform.setdefault(plat, []).append(node)

#     for platform, items in by_platform.items():
#         print(f"\n{platform}:")
#         for item in items:
#             filled = int(item["confidence"] * 5)
#             bar = "||" * filled + "|." * (5 - filled)
#             print(f"{item['label']}")
#             print(f"{item['url']}")
#             print(f"Confidence: [{bar}] {item['confidence']:.0%}")
#             if item.get("snippet"):
#                 snip = item["snippet"][:82] + "..." if len(item["snippet"]) > 85 else item["snippet"]
#                 print(f"{snip}")

#     if not nodes:
#         print("Niciun profil gasit.")


# def main():
#     scraper = ProfileScraper(headless = True, delay = 2.0)

#     try:
#         scraper.driver = _build_driver(scraper.headless)

#         while True:
#             name = input("Introdu numele (sau 'exit'): ").strip()

#             if not name:
#                 continue
#             if name.lower() in ("exit", "quit", "q"):
#                 print("\nLa revedere!")
#                 break

#             result = scraper.search(name)
#             _print_summary(result)

#             safe = re.sub(r"[^\w\-]", "_", name)
#             ts = datetime.now().strftime("%Y%m%d_%H%M%S")
#             out_path = OUTPUT_DIR / f"{safe}_{ts}.json"
#             with open(out_path, "w", encoding="utf-8") as f:
#                 json.dump(result, f, ensure_ascii=False, indent=2)
#             print(f"\nSalvat: {out_path}")
#             print("\n" + "─" * 55 + "\n")

#     except KeyboardInterrupt:
#         print("\n\nLa revedere!")
#     finally:
#         scraper._quit()


# if __name__ == "__main__":
#     main()