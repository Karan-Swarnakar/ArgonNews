"""
Central Source Configuration Registry for ArgonNews
===================================================
Each source defines its name, type, reliability score, collector type,
feed/API endpoint URL, enabled state, and category tags.
"""

from typing import Dict, Any, List

SOURCES: List[Dict[str, Any]] = [
    # -------------------------------------------------------------------------
    # 1. PRIMARY AI / RESEARCH LABS (Official / Frontier AI Labs)
    # -------------------------------------------------------------------------
    {
        "id": "meta_ai",
        "name": "Meta AI",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://about.fb.com/news/feed/",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Meta AI announcements and research news from Meta Newsroom."
    },
    {
        "id": "microsoft_research",
        "name": "Microsoft Research",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://www.microsoft.com/en-us/research/feed/",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Microsoft Research blog spanning foundational models, algorithms, and systems."
    },
    {
        "id": "nvidia_blog",
        "name": "NVIDIA Blog AI",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://blogs.nvidia.com/feed/",
        "enabled": True,
        "category": "HARDWARE",
        "description": "NVIDIA official AI infrastructure, GPUs, CUDA, and enterprise AI breakthroughs."
    },
    {
        "id": "hugging_face",
        "name": "Hugging Face",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://huggingface.co/blog/feed.xml",
        "enabled": True,
        "category": "OPEN_SOURCE",
        "description": "Open source AI models, datasets, transformers, and community releases."
    },
    {
        "id": "amazon_science",
        "name": "Amazon Science",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://www.amazon.science/index.rss",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Amazon science and machine learning research publications."
    },
    {
        "id": "apple_ml",
        "name": "Apple ML Research",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://machinelearning.apple.com/rss.xml",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Apple Machine Learning Research papers and on-device intelligence."
    },
    {
        "id": "qwen_alibaba",
        "name": "Qwen / Alibaba Cloud",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://qwenlm.github.io/blog/index.xml",
        "enabled": True,
        "category": "MODEL",
        "description": "Qwen team open foundation models, vision-language architectures, and technical reports."
    },
    {
        "id": "openai",
        "name": "OpenAI",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://openai.com/news/rss.xml",
        "enabled": True,
        "category": "MODEL",
        "description": "OpenAI official news and model releases."
    },
    {
        "id": "google_deepmind",
        "name": "Google DeepMind",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "rss",
        "url": "https://deepmind.google/blog/rss.xml",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Google DeepMind research discoveries, Gemini breakthroughs, and science AI."
    },
    {
        "id": "anthropic",
        "name": "Anthropic",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://www.anthropic.com/news",
        "enabled": True,
        "category": "MODEL",
        "description": "Anthropic Claude model updates, research, and alignment announcements."
    },
    {
        "id": "mistral_ai",
        "name": "Mistral AI",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://mistral.ai/news/",
        "enabled": True,
        "category": "MODEL",
        "description": "Mistral open and commercial frontier model releases."
    },
    {
        "id": "cohere",
        "name": "Cohere",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://cohere.com/blog",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Cohere enterprise search, embeddings, and Command model updates."
    },
    {
        "id": "ai21_labs",
        "name": "AI21 Labs",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://www.ai21.com/blog",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "AI21 Labs Jamba, state-space architectures, and enterprise AI."
    },
    {
        "id": "allen_ai",
        "name": "Allen Institute for AI (AI2)",
        "source_type": "research",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://allenai.org/research",
        "enabled": True,
        "category": "RESEARCH",
        "description": "AI2 open science, OLMo models, datasets, and NLP research."
    },
    {
        "id": "xai",
        "name": "xAI",
        "source_type": "official",
        "reliability": 1.00,
        "collector_type": "web",
        "url": "https://x.ai/blog",
        "enabled": False,
        "disabled_reason": "HTTP 403 Forbidden: Cloudflare anti-bot bot-blocking restricts direct programmatic access without browser emulation.",
        "category": "MODEL",
        "description": "Grok models and reasoning research."
    },

    # -------------------------------------------------------------------------
    # 2. ACADEMIC & INSTITUTIONAL SOURCES
    # -------------------------------------------------------------------------
    {
        "id": "stanford_hai",
        "name": "Stanford HAI",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "web",
        "url": "https://hai.stanford.edu/news",
        "enabled": True,
        "category": "ETHICS",
        "description": "Stanford Institute for Human-Centered Artificial Intelligence policy & research."
    },
    {
        "id": "mit_csail",
        "name": "MIT CSAIL / AI News",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "rss",
        "url": "https://news.mit.edu/rss/topic/artificial-intelligence2",
        "enabled": True,
        "category": "RESEARCH",
        "description": "MIT Computer Science and Artificial Intelligence Laboratory breakthroughs."
    },
    {
        "id": "berkeley_bair",
        "name": "Berkeley AI Research (BAIR)",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "rss",
        "url": "https://bair.berkeley.edu/blog/feed.xml",
        "enabled": True,
        "category": "RESEARCH",
        "description": "UC Berkeley AI Lab research spanning reinforcement learning, vision, and robotics."
    },
    {
        "id": "nist_ai",
        "name": "NIST AI",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "rss",
        "url": "https://www.nist.gov/news-events/news/rss.xml",
        "enabled": True,
        "category": "POLICY",
        "description": "National Institute of Standards and Technology AI Risk Management & standards."
    },
    {
        "id": "uk_aisi",
        "name": "UK AI Security Institute",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "rss",
        "url": "https://www.gov.uk/government/organisations/ai-safety-institute.atom",
        "enabled": True,
        "category": "POLICY",
        "description": "UK Safety & Security Institute frontier evaluations and safety standards."
    },
    {
        "id": "arxiv_cs_ai",
        "name": "arXiv cs.AI",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "arxiv",
        "url": "https://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending",
        "arxiv_category": "cs.AI",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Latest peer-reviewed and preprint submissions in Artificial Intelligence."
    },
    {
        "id": "arxiv_cs_lg",
        "name": "arXiv cs.LG",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "arxiv",
        "url": "https://export.arxiv.org/api/query?search_query=cat:cs.LG&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending",
        "arxiv_category": "cs.LG",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Latest Machine Learning research preprints and algorithmic innovations."
    },
    {
        "id": "arxiv_cs_cl",
        "name": "arXiv cs.CL",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "arxiv",
        "url": "https://export.arxiv.org/api/query?search_query=cat:cs.CL&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending",
        "arxiv_category": "cs.CL",
        "enabled": True,
        "category": "RESEARCH",
        "description": "Computation and Language / NLP / LLM architectures and evaluations."
    },
    {
        "id": "papers_with_code",
        "name": "Papers with Code",
        "source_type": "academic",
        "reliability": 0.95,
        "collector_type": "api",
        "url": "https://paperswithcode.com/api/v1/papers/?ordering=-published",
        "enabled": False,
        "disabled_reason": "Endpoint deprecated: The v1 public REST API returns SPA web HTML. Replaced by direct verified arXiv query endpoints.",
        "category": "RESEARCH",
        "description": "Trending machine learning research and benchmarks."
    },

    # -------------------------------------------------------------------------
    # 3. PROFESSIONAL JOURNALISM
    # -------------------------------------------------------------------------
    {
        "id": "ieee_spectrum",
        "name": "IEEE Spectrum AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "In-depth engineering and computer science reporting on AI systems."
    },
    {
        "id": "mit_tech_review",
        "name": "MIT Technology Review AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Critical investigative coverage of AI technology and societal impacts."
    },
    {
        "id": "ars_technica",
        "name": "Ars Technica AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Technical analysis of AI architectures, open weights, and enterprise tools."
    },
    {
        "id": "the_verge",
        "name": "The Verge AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Broadsheet reporting on consumer AI, products, and tech policy."
    },
    {
        "id": "techcrunch_ai",
        "name": "TechCrunch AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "AI startup funding, venture capital, and commercial product launches."
    },
    {
        "id": "venturebeat_ai",
        "name": "VentureBeat AI",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "rss",
        "url": "https://venturebeat.com/category/ai/feed",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Enterprise generative AI, infrastructure, and agent workflows."
    },
    {
        "id": "reuters_tech",
        "name": "Reuters Technology",
        "source_type": "journalism",
        "reliability": 0.90,
        "collector_type": "web",
        "url": "https://www.reuters.com/technology/artificial-intelligence/",
        "enabled": False,
        "disabled_reason": "HTTP 401 Forbidden / Paywall: Reuters anti-scraping policy prevents unauthenticated feeds.",
        "category": "INDUSTRY",
        "description": "Global wire coverage of tech antitrust and AI regulations."
    },

    # -------------------------------------------------------------------------
    # 4. SPECIALIST AI SOURCES
    # -------------------------------------------------------------------------
    {
        "id": "import_ai",
        "name": "Import AI",
        "source_type": "specialist",
        "reliability": 0.80,
        "collector_type": "rss",
        "url": "https://importai.substack.com/feed",
        "enabled": True,
        "category": "ETHICS",
        "description": "Jack Clark's weekly newsletter on AI safety, compute policy, and capability trends."
    },
    {
        "id": "the_batch",
        "name": "The Batch by DeepLearning.AI",
        "source_type": "specialist",
        "reliability": 0.80,
        "collector_type": "web",
        "url": "https://www.deeplearning.ai/the-batch",
        "enabled": True,
        "category": "INDUSTRY",
        "description": "Andrew Ng's curated weekly intelligence briefing on machine learning developments."
    },
    {
        "id": "the_gradient",
        "name": "The Gradient",
        "source_type": "specialist",
        "reliability": 0.80,
        "collector_type": "rss",
        "url": "https://thegradient.pub/rss/",
        "enabled": True,
        "category": "RESEARCH",
        "description": "In-depth essays, technical interviews, and perspectives by AI researchers."
    },
    {
        "id": "latent_space",
        "name": "Latent Space",
        "source_type": "specialist",
        "reliability": 0.80,
        "collector_type": "rss",
        "url": "https://www.latent.space/feed",
        "enabled": True,
        "category": "MODEL",
        "description": "AI engineer community publication focusing on LLMOps, evals, and reasoning."
    },
    {
        "id": "semianalysis",
        "name": "SemiAnalysis",
        "source_type": "specialist",
        "reliability": 0.80,
        "collector_type": "rss",
        "url": "https://semianalysis.com/feed/",
        "enabled": True,
        "category": "HARDWARE",
        "description": "Semiconductor, silicon roadmap, datacenter networking, and AI hardware economics."
    }
]


def get_enabled_sources() -> List[Dict[str, Any]]:
    """Returns only sources currently marked enabled."""
    return [s for s in SOURCES if s.get("enabled", True)]


def get_source_by_id(source_id: str) -> Dict[str, Any]:
    """Retrieves a source configuration by its ID."""
    for s in SOURCES:
        if s["id"] == source_id:
            return s
    raise ValueError(f"Source with id '{source_id}' not found.")
