import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


def collect_website(source):
    url = source["url"]

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, headers=headers, timeout=15)

    if response.status_code != 200:
        print(f"Failed: {source['name']} ({response.status_code})")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    articles = []

    for link in soup.find_all("a", href=True):

        title = link.get_text(" ", strip=True)
        article_url = urljoin(url, link["href"])

        # Ignore links without meaningful titles
        if len(title) < 20:
            continue

        # Ignore obvious navigation links
        bad_words = [
            "login",
            "sign up",
            "subscribe",
            "careers",
            "privacy",
            "terms",
            "contact",
            "about"
        ]

        if any(word in title.lower() for word in bad_words):
            continue

        # Only keep links belonging to the same website
        if not article_url.startswith(url.split("/", 3)[0] + "//"):
            continue

        articles.append({
            "title": title,
            "url": article_url,
            "source": source["name"],
            "source_type": source["type"],
            "reliability": source["reliability"]
        })

    return articles