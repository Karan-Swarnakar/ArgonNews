from processing.analyzer import analyze_article


article = {
    "title": "OpenAI releases a new AI model",

    "content": """
    OpenAI announced a new artificial intelligence model
    with improved reasoning and coding capabilities.
    """
}


result = analyze_article(article)

print("\nRESULT:")
print(result)