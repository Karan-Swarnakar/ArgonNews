"""
Article Intelligence & Distillation Pipeline
============================================
Performs AI synthesis on ingested articles using Ollama (Qwen 2.5) with
graceful heuristic fallback to ensure high-quality structured intelligence
(summary, why_it_matters, importance, entities, technologies, category).
"""

import json
import re
import urllib.request
from typing import Dict, Any, List, Optional


KNOWN_COMPANIES = [
    "OpenAI", "Anthropic", "Google DeepMind", "Google", "Meta", "Microsoft",
    "NVIDIA", "Hugging Face", "Mistral AI", "Cohere", "AI21 Labs", "Allen Institute for AI",
    "Apple", "Amazon", "Alibaba", "Tencent", "Baidu", "xAI", "Intel", "AMD", "Qualcomm",
    "Stability AI", "Runway", "Midjourney", "Scale AI", "Cerebras", "Groq"
]

KNOWN_TECHS = [
    "Transformer", "LLM", "Diffusion", "Reinforcement Learning", "RLHF", "DPO", "PPO",
    "Quantization", "Mixture of Experts", "MoE", "Vision-Language", "VLM", "Agent", "Reasoning",
    "RAG", "Vector Database", "Fine-Tuning", "LoRA", "Context Window", "CUDA", "H100", "Blackwell",
    "Watermarking", "Synthetic Data", "Chain of Thought", "Distillation", "Multimodal", "Embedding"
]


def extract_entities_heuristic(text: str) -> Dict[str, List[str]]:
    """Heuristic entity extraction from article title and content."""
    companies = []
    technologies = []

    for comp in KNOWN_COMPANIES:
        if re.search(r"\b" + re.escape(comp) + r"\b", text, re.IGNORECASE):
            if comp not in companies:
                companies.append(comp)

    for tech in KNOWN_TECHS:
        if re.search(r"\b" + re.escape(tech) + r"\b", text, re.IGNORECASE):
            if tech not in technologies:
                technologies.append(tech)

    return {"companies": companies, "technologies": technologies}


def calculate_importance_heuristic(article: Dict[str, Any]) -> int:
    """Calculates an importance score (1-10) based on source authority and keywords."""
    score = 6
    reliability = float(article.get("reliability", 1.0))
    if reliability >= 1.0:
        score += 1
    elif reliability <= 0.8:
        score -= 1

    text = (article.get("title", "") + " " + article.get("content", "")).lower()

    high_impact_keywords = [
        "breakthrough", "state-of-the-art", "frontier", "introducing", "release",
        "next-generation", "safety", "benchmark", "trillion", "opus", "gpt-5",
        "gemini", "claude", "llama 4", "deepseek", "reasoning model"
    ]
    matches = sum(1 for kw in high_impact_keywords if kw in text)
    if matches >= 2:
        score += 2
    elif matches >= 1:
        score += 1

    # Research papers
    if article.get("source_type") == "academic":
        score = max(6, score)

    return max(1, min(10, score))


def analyze_with_ollama(article: Dict[str, Any], model_name: str = "qwen2.5:latest") -> Optional[Dict[str, Any]]:
    """Attempts to analyze an article using local Ollama instance with Qwen 2.5."""
    prompt = f"""You are an expert AI intelligence analyst for ArgonNews.
Analyze the following AI article and output ONLY valid JSON matching this exact schema:
{{
  "summary": "2-sentence clear objective executive summary of the technical announcement",
  "why_it_matters": "1-2 sentences explaining the broader implications for AI researchers, developers, or industry",
  "importance": 1-10 integer,
  "category": "RESEARCH" | "MODEL" | "INDUSTRY" | "ETHICS" | "HARDWARE" | "POLICY" | "OPEN_SOURCE" | "TOOL",
  "companies": ["List of relevant companies or labs mentioned"],
  "technologies": ["List of AI models, architectures, or techniques mentioned"]
}}

Article Title: {article.get('title')}
Source: {article.get('source')} ({article.get('source_type')})
Content: {article.get('content', '')[:1500]}
"""
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2
        }
    }

    try:
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            response_text = data.get("response", "")
            parsed = json.loads(response_text)
            if "summary" in parsed and "why_it_matters" in parsed:
                return {
                    "summary": str(parsed["summary"]).strip(),
                    "why_it_matters": str(parsed["why_it_matters"]).strip(),
                    "importance": int(parsed.get("importance", 6)),
                    "category": str(parsed.get("category", article.get("category", "INDUSTRY"))).upper(),
                    "companies": [str(c) for c in parsed.get("companies", [])],
                    "technologies": [str(t) for t in parsed.get("technologies", [])]
                }
    except Exception:
        # Ollama not running or timeout -> return None to fall back to heuristic engine
        return None


def analyze_article(article: Dict[str, Any]) -> Dict[str, Any]:
    """Analyzes an article using Ollama Qwen if available, with heuristic fallback."""
    # 1. Check if high-quality analysis already exists (e.g. from existing cache)
    existing_analysis = article.get("analysis")
    if (
        isinstance(existing_analysis, dict)
        and existing_analysis.get("summary")
        and len(existing_analysis.get("summary", "")) > 40
        and existing_analysis.get("why_it_matters")
    ):
        return existing_analysis

    # 2. Try Ollama (Qwen)
    ollama_result = analyze_with_ollama(article)
    if ollama_result:
        return ollama_result

    # 3. Heuristic Rule-Based Intelligence Engine
    title = article.get("title", "")
    content = article.get("content", "")
    full_text = f"{title} {content}"

    entities = extract_entities_heuristic(full_text)
    importance = calculate_importance_heuristic(article)
    category = article.get("category", "INDUSTRY")

    # Generate polished executive summary
    source = article.get("source", "Industry reports")
    summary = f"{title}. {source} reports key technical and operational developments in this area."
    if content and len(content) > 100:
        first_sentence = content.split(". ")[0].strip()
        if len(first_sentence) > 30 and not first_sentence.startswith("<"):
            summary = f"{first_sentence}. This marks an active development highlighted by {source}."

    why_it_matters = f"Significantly impacts the landscape of {category.lower().replace('_', ' ')} capabilities and enterprise AI deployment."
    if "MODEL" in category:
        why_it_matters = "Advances the state of foundational and frontier models, improving compute efficiency and developer access."
    elif "RESEARCH" in category:
        why_it_matters = "Provides novel empirical methodologies and benchmark insights for machine learning research teams."
    elif "HARDWARE" in category:
        why_it_matters = "Affects semiconductor scaling, compute infrastructure economics, and data center deployment capacity."
    elif "POLICY" in category or "ETHICS" in category:
        why_it_matters = "Shapes governance standards, model evaluations, alignment frameworks, and compliance guidelines."

    return {
        "summary": summary,
        "why_it_matters": why_it_matters,
        "importance": importance,
        "category": category,
        "companies": entities["companies"],
        "technologies": entities["technologies"]
    }
