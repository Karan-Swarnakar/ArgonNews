import json
from processing.analyzer import analyze_article


INPUT_FILE = "articles.json"


with open(INPUT_FILE, "r", encoding="utf-8") as file:
    articles = json.load(file)


# Start with only 5 articles
articles = articles[:5]


analyzed_articles = []


for i, article in enumerate(articles):

    print(f"Analyzing article {i + 1}/{len(articles)}:")
    print(article["title"])

    analysis = analyze_article(article)

    if analysis:
        article["analysis"] = analysis
        analyzed_articles.append(article)


with open("analyzed_articles.json", "w", encoding="utf-8") as file:

    json.dump(
        analyzed_articles,
        file,
        indent=4,
        ensure_ascii=False
    )


print(f"\nFinished analyzing {len(analyzed_articles)} articles.")