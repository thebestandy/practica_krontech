from playwright.sync_api import sync_playwright

def parse_saved_links():
    # 1. Read the links from the file
    try:
        with open("links.txt", "r", encoding="utf-8") as f:
            # Clean up the lines and remove empty ones
            urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("🚨 Error: links.txt not found. Run get_links.py first!")
        return

    print(f"📂 Loaded {len(urls)} URLs to parse.\n")

    # 2. Fire up Playwright to visit the profiles
    with sync_playwright() as p:
        # We run this VISIBLE (headless=False) so you can see if you hit a Login Wall
        browser = p.chromium.launch(headless=False)
        
        try:
            context = browser.new_context(
                storage_state="auth.json", # <--- THIS IS THE MAGIC LINE
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            print("🍪 Successfully loaded auth.json cookies!")
        except Exception:
            print("⚠️ No auth.json found. Running anonymously (LinkedIn WILL block you).")
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

        page = context.new_page()
        
        for url in urls:
            print(f"🌐 Visiting: {url}")
            try:
                # Go to the profile page
                page.goto(url, timeout=15000)
                
                # Give the page 2 seconds to load its JavaScript
                page.wait_for_timeout(2000) 
                
                # Extract the Page Title
                title = page.title()
                
                # Extract the Meta Description (This usually contains the clean bio/follower count)
                try:
                    bio = page.locator('meta[name="description"]').get_attribute("content", timeout=2000)
                except:
                    bio = "No meta description found (Site might be blocking us or requires login)."
                
                print(f"👤 Name/Title: {title}")
                print(f"📝 Bio/Info: {bio}")
                print("-" * 50)
                
            except Exception as e:
                print(f"❌ Failed to parse {url} - Error: {e}")
                print("-" * 50)
                
        print("✅ Finished parsing all profiles!")
        browser.close()

if __name__ == "__main__":
    parse_saved_links()