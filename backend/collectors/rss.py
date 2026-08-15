import feedparser


def collect_rss(feed_url):
    feed = feedparser.parse(feed_url)

    articles = []

    for entry in feed.entries:
        article = {
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "published": entry.get("published", ""),
            "summary": entry.get("summary", "")
        }

        articles.append(article)

    return articles