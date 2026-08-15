def classify_article(article):

    text = (
        article["title"] + " " +
        article.get("content", "")
    ).lower()

    if any(word in text for word in [
        "research paper",
        "arxiv",
        "study",
        "benchmark"
    ]):
        return "RESEARCH"

    if any(word in text for word in [
        "model",
        "llm",
        "language model",
        "gpt",
        "claude",
        "gemini"
    ]):
        return "MODEL"

    if any(word in text for word in [
        "open source",
        "github",
        "opensource"
    ]):
        return "OPEN_SOURCE"

    if any(word in text for word in [
        "funding",
        "investment",
        "acquisition",
        "startup"
    ]):
        return "BUSINESS"

    if any(word in text for word in [
        "safety",
        "alignment",
        "regulation",
        "policy"
    ]):
        return "SAFETY_POLICY"

    return "OTHER"