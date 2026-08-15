import requests
from bs4 import BeautifulSoup


def extract_article(url):

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=15
    )

    if response.status_code != 200:
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove things that aren't article content
    for element in soup([
        "script",
        "style",
        "nav",
        "footer",
        "header"
    ]):
        element.decompose()

    paragraphs = soup.find_all("p")

    content = " ".join(
        p.get_text(" ", strip=True)
        for p in paragraphs
    )

    return content