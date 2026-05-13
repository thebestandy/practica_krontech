# Profile Scraper via DuckDuckGo - Selenium

import json
import time
import random
import re
import logging
from dataclasses import dataclass, asdict, field
from typing import List, Optional
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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

OUTPUT_DIR = Path("./scraper/scrapers/duckduckgo")
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

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class PersonResult:
    query: str
    searched_at: str
    profiles: List[ProfileResult] = field(default_factory = list)

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "searched_at": self.searched_at,
            "total_found": len(self.profiles),
            "results": _group_by_platform(self.profiles),
        }


def _group_by_platform(profiles: List[ProfileResult]) -> dict:
    grouped = {k: [] for k in PLATFORMS}
    for p in profiles:
        if p.platform_key in grouped:
            grouped[p.platform_key].append(p.to_dict())
    return grouped


def _build_driver(headless: bool = False) -> webdriver.Chrome:
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


def is_valid_profile_url(url: str, platform_key: str) -> bool:
    cfg = PLATFORMS[platform_key]
    url_lower = url.lower()
    parsed = urlparse(url)

    if parsed.query or parsed.fragment:
        return False

    for ep in cfg.get("exclude_paths", []):
        if ep in url_lower:
            return False

    return bool(re.search(cfg["url_pattern"], url, re.IGNORECASE))


def extract_username(url: str, platform_key: str) -> Optional[str]:
    pattern = PLATFORMS[platform_key]["url_pattern"]
    match = re.search(pattern, url, re.IGNORECASE)
    return match.group(1) if match else None


def confidence_score(name: str, title: str, snippet: str, username: Optional[str]) -> float:
    score = 0.4
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 2]
    name_compact = re.sub(r"[^a-z0-9]", "", name_lower)

    if username:
        u_clean = re.sub(r"[^a-z0-9]", "", username.lower())
        if name_compact in u_clean or u_clean in name_compact:
            score += 0.35
        elif any(part in u_clean for part in name_parts):
            score += 0.20

    t = title.lower()
    if name_lower in t:
        score += 0.15
    elif all(p in t for p in name_parts):
        score += 0.10

    s = snippet.lower()
    if name_lower in s:
        score += 0.05

    return min(round(score, 2), 1.0)


class DDGSeleniumScraper:

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)
        self.delay = delay

    def search(self, query: str, max_results: int = 8) -> list[dict]:
        log.info(f"[DDG] Query: {query!r}")

        try:
            self.driver.get(DDG_URL)
            time.sleep(self.delay)

            search_box = self._find_search_box()
            if not search_box:
                log.warning("[DDG] Campul de cautare nu a fost gasit.")
                return []

            search_box.clear()
            time.sleep(0.3)

            for char in query:
                search_box.send_keys(char)
                time.sleep(random.uniform(0.03, 0.09))

            time.sleep(random.uniform(0.5, 1.0))
            search_box.send_keys(Keys.RETURN)

            time.sleep(self.delay + random.uniform(1.0, 2.0))

            return self._parse_results(max_results)

        except Exception as e:
            log.error(f"[DDG] Eroare la cautare: {e}")
            return []

    def _find_search_box(self):
        selectors = [
            (By.NAME, "q"),
            (By.CSS_SELECTOR, "input[type='search']"),
            (By.CSS_SELECTOR, "input[type='text']"),
            (By.CSS_SELECTOR, "#searchbox_input"),
            (By.CSS_SELECTOR, ".searchbox_input"),
        ]
        for by, sel in selectors:
            try:
                el = self.driver.find_element(by, sel)
                if el.is_displayed():
                    return el
            except NoSuchElementException:
                continue
        return None

    def _parse_results(self, max_results: int) -> list[dict]:
        soup = BeautifulSoup(self.driver.page_source, "lxml")
        results = []

        articles = soup.select("article[data-testid='result']")

        if not articles:
            articles = soup.select("li[data-layout='organic']")

        if not articles:
            articles = soup.select(".result, .web-result")

        log.info(f"[DDG] Elemente gasite in HTML: {len(articles)}")

        for art in articles[:max_results * 2]:
            try:
                link = art.select_one("a[data-testid='result-title-a'], h2 a, .result__title a")
                if not link:
                    continue

                url = link.get("href", "")
                if not url or url.startswith("//duckduckgo"):
                    continue

                title = link.get_text(strip = True)

                snippet_el = art.select_one(
                    "[data-result='snippet'], .result__snippet, span[class*='snippet'], div[class*='snippet']"
                )
                snippet = snippet_el.get_text(strip = True) if snippet_el else ""

                if url and title:
                    results.append({
                        "url": url,
                        "title": title,
                        "snippet": snippet,
                    })

            except Exception as e:
                log.debug(f"[DDG] Eroare parsare element: {e}")

        log.info(f"[DDG] Rezultate valide extrase: {len(results)}")
        return results[:max_results]


class ProfileFinder:

    def __init__(self, driver: webdriver.Chrome, delay: float = 2.0):
        self.ddg = DDGSeleniumScraper(driver, delay)
        self.delay = delay

    def search_platform(self, name: str, platform_key: str) -> List[ProfileResult]:
        cfg = PLATFORMS[platform_key]
        query = cfg["query_template"].format(name=name)

        print(f"{cfg['emoji']} {cfg['label']}: cauta...", end = "", flush = True)

        raw = self.ddg.search(query, max_results = 8)

        profiles = []
        seen = set()

        for r in raw:
            url = r.get("url", "")
            if not url or url in seen:
                continue

            if is_valid_profile_url(url, platform_key):
                username = extract_username(url, platform_key)
                score = confidence_score(name, r.get("title", ""), r.get("snippet", ""), username)

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

        profiles.sort(key=lambda x: x.confidence, reverse = True)
        profiles = profiles[:3]

        status = f"{len(profiles)} gasite" if profiles else " — nimic"
        print(status)

        return profiles

    def search_all(self, name: str) -> PersonResult:
        print(f"\nCaut: \"{name}\"")
        print("─" * 50)

        result = PersonResult(
            query = name,
            searched_at = datetime.now().isoformat(),
        )

        for i, platform_key in enumerate(PLATFORMS):
            profiles = self.search_platform(name, platform_key)
            result.profiles.extend(profiles)

            if i < len(PLATFORMS) - 1:
                time.sleep(random.uniform(2.0, 4.0))

        total = len(result.profiles)
        print("─" * 50)
        print(f"Total: {total} profiluri gasite\n")

        return result


def save_json(data: dict) -> Path:
    safe_name = re.sub(r"[^\w\-]", "_", data["query"])
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = OUTPUT_DIR / f"{safe_name}_{ts}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def print_summary(result: PersonResult):
    print("\nSUMMARY")
    print("=" * 50)

    grouped = _group_by_platform(result.profiles)
    any_found = False

    for platform_key, profiles in grouped.items():
        if not profiles:
            continue

        any_found = True
        cfg = PLATFORMS[platform_key]
        print(f"\n{cfg['emoji']}  {cfg['label']}:")

        for i, p in enumerate(profiles, 1):
            filled = int(p["confidence"] * 5)
            bar = "█" * filled + "░" * (5 - filled)
            uname = f"@{p['username']}" if p.get("username") else "(username necunoscut)"
            snippet = p.get("snippet", "")
            if len(snippet) > 85:
                snippet = snippet[:82] + "..."

            print(f"  {i}. {uname}")
            print(f"     {p['url']}")
            print(f"     Confidence: [{bar}] {p['confidence']:.0%}")
            if snippet:
                print(f"     {snippet}")

    if not any_found:
        print("\n  Niciun profil gasit.")


class ProfileScraper:

    def __init__(self, headless: bool = False, delay: float = 2.0):
        self.headless = headless
        self.delay = delay
        self.driver = None

    def __enter__(self):
        self.driver = _build_driver(self.headless)
        return self

    def __exit__(self, *_):
        if self.driver:
            self.driver.quit()
            self.driver = None

    def search(self, name: str) -> PersonResult:
        if not self.driver:
            self.driver = _build_driver(self.headless)
        finder = ProfileFinder(self.driver, self.delay)
        return finder.search_all(name)


def main():
    print("\nProfile Scraper — DuckDuckGo (Selenium)")
    print("=" * 50)
    print("Browserul Chrome se va deschide automat pentru fiecare cautare.")
    print("Ctrl+C pentru a iesi.\n")

    scraper = ProfileScraper(headless = False, delay = 2.0)

    try:
        scraper.driver = _build_driver(scraper.headless)

        while True:
            name = input("Introdu numele (sau 'exit'): ").strip()

            if not name:
                continue
            if name.lower() in ("exit", "quit", "q"):
                print("\nLa revedere!")
                break

            finder = ProfileFinder(scraper.driver, scraper.delay)
            result = finder.search_all(name)

            print_summary(result)

            data = result.to_dict()
            saved = save_json(data)
            print(f"\nSalvat: {saved}")
            print("\n" + "─" * 50 + "\n")

    except KeyboardInterrupt:
        print("\n\nLa revedere!")
    finally:
        if scraper.driver:
            scraper.driver.quit()


if __name__ == "__main__":
    main()