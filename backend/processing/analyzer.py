import ollama
import json


def analyze_article(article):

    prompt = f"""
You are the senior AI analyst for Argon News.

Analyze this AI-related article.

TITLE:
{article["title"]}

CONTENT:
{article["content"]}

Return ONLY valid JSON:

{{
    "summary": "A concise 2-3 sentence summary",
    "why_it_matters": "Explain why this matters to the AI industry",
    "importance": 1,
    "category": "MODEL",
    "companies": [],
    "technologies": []
}}

Rules:

- importance must be an integer from 1 to 10.
- 10 = extremely significant development.
- 1 = almost irrelevant.
- category must be one of:
  MODEL
  RESEARCH
  OPEN_SOURCE
  BUSINESS
  SAFETY_POLICY
  OTHER
- Do not invent facts.
- Keep the summary factual.
"""

    response = ollama.chat(
        model="qwen2.5",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    result = response["message"]["content"]

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        print("Could not parse response:")
        print(result)
        return None