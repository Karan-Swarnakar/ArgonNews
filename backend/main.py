from collectors.website import collect_website
from collectors.article import extract_article
from collectors.cleaner import clean_text
from processing.classifier import classify_article
from sources import SOURCES

import json
from pathlib import Path


all_articles = []


for source in SOURCES:

    print(f"Collecting from {source['name']}...")

    articles = collect_website(source)

    print(f"Found {len(articles)} candidate articles")

    for article in articles:

        print(f"Extracting: {article['title']}")

        content = extract_article(article["url"])

        if content:
            content = clean_text(content)
            article["content"] = content
            article["category"] = classify_article(article)
            all_articles.append(article)



unique_articles = {}

for article in all_articles:
    unique_articles[article["url"]] = article

all_articles = list(unique_articles.values())

print(f"Unique articles: {len(all_articles)}")




output_file = Path(__file__).resolve().parent.parent / "articles.json"

with open(output_file, "w", encoding="utf-8") as file:
    json.dump(
        all_articles,
        file,
        indent=4,
        ensure_ascii=False
    )

print("Saved articles to articles.json")