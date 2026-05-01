from playwright.sync_api import sync_playwright

def gather_links(name):
    query = f'"{name}" (site:instagram.com OR site:github.com)'
    urls_found = []
    
    with sync_playwright() as p:
        # FIX 1: Change headless to False. DDG is blocking the invisible bot fingerprint.
        browser = p.chromium.launch(headless=False)
        
        # FIX 2: Add a realistic User-Agent to the context
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print(f"🕸️ Spidering DuckDuckGo for: {name}...")
        try:
            page.goto("https://duckduckgo.com/")
            page.locator("input[name='q']").fill(query)
            page.keyboard.press("Enter")
            
            try:
                # Wait for the results to load
                page.wait_for_selector('article[data-testid="result"]', timeout=10000)
            except Exception:
                # FIX 3: If it times out, pause the script so YOU can solve the CAPTCHA
                print("🚨 Timeout! DuckDuckGo is likely showing a CAPTCHA.")
                print("👉 Look at the browser window and solve it manually. You have 20 seconds...")
                page.wait_for_timeout(20000) # Gives you 20 seconds to click "I am human"
            
            # Extract only the URLs
            results = page.locator('a[data-testid="result-title-a"]').all()
            for r in results:
                link = r.get_attribute("href")
                if link:
                    urls_found.append(link)
                    
        except Exception as e:
            print(f"🚨 Critical failure: {e}")
            
        finally:
            browser.close()
            
    # Save the links to a text file
    if urls_found:
        with open("links.txt", "w", encoding="utf-8") as f:
            for url in urls_found:
                f.write(url + "\n")
        print(f"✅ Successfully saved {len(urls_found)} URLs to links.txt!")
    else:
        print("❌ No links found to save.")

if __name__ == "__main__":
    target = input("Enter the target's name: ")
    gather_links(target)