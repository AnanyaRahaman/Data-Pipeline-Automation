import sys, json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def main():
    payload = json.loads(sys.stdin.read() or "{}")
    url = payload.get("url")

    if not url:
        print(json.dumps({"error": "missing url"}))
        return

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)

        driver.get(url)
        html = driver.page_source

        print(json.dumps({
            "url": url,
            "html": html
        }))

        driver.quit()

    except Exception as e:
        print(json.dumps({
            "url": url,
            "error": str(e)
        }))

if __name__ == "__main__":
    main()