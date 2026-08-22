"""
ArgonNews Image Enrichment & Licensing Module
=============================================
Provides copyright-safe, legally verified image selection for AI news dispatches.
Uses verified imagery from Unsplash (Unsplash License), Wikimedia Commons (CC BY-SA / CC BY / Public Domain),
and NASA / US Government (Public Domain). Preserves full attribution, author credit, license, and descriptive alt text.
"""

from typing import Dict, Any, Optional, List
import re
import hashlib

# Verified Image Catalog with explicit licenses, credits, source providers, and descriptive alt text
VERIFIED_IMAGE_CATALOG: List[Dict[str, Any]] = [
    # 1. Foundation Models, LLMs & Neural Networks
    {
        "id": "model-neural-mesh",
        "url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Cash Macanaya / Unsplash",
        "alt": "Abstract digital neural network and artificial intelligence concept visualization",
        "domains": ["MODEL", "RESEARCH"],
        "keywords": ["gpt", "claude", "gemini", "llama", "llm", "foundation model", "deep learning", "neural network", "transformer", "reasoning", "qwen", "mistral", "sonnet", "opus", "o3", "o1"]
    },
    {
        "id": "model-latent-space",
        "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Milad Fakurian / Unsplash",
        "alt": "Abstract generative AI dynamic latent wave representation",
        "domains": ["MODEL", "RESEARCH"],
        "keywords": ["diffusion", "generative", "latent", "weights", "fine-tuning", "distillation", "synthesis", "text-to-image", "flux", "stable diffusion"]
    },
    {
        "id": "deepmind-research-abstract",
        "url": "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Google DeepMind / Unsplash",
        "alt": "3D geometric neural representation of artificial intelligence reasoning and planning",
        "domains": ["RESEARCH", "MODEL"],
        "keywords": ["deepmind", "google deepmind", "agent", "planning", "reinforcement learning", "alpha", "reasoning model", "mcts", "tree search"]
    },
    {
        "id": "deepmind-intelligence-art",
        "url": "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Google DeepMind / Unsplash",
        "alt": "Visual art abstraction of artificial intelligence and machine learning representations",
        "domains": ["MODEL", "RESEARCH"],
        "keywords": ["multimodal", "intelligence", "cognitive", "benchmark", "evaluation", "frontier", "capability", "agi"]
    },
    {
        "id": "wikimedia-neural-topology",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Artificial_neural_network.svg",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0",
        "credit": "C. Bickel / Wikimedia Commons",
        "alt": "Diagrammatic topology of an artificial neural network with interconnected compute nodes",
        "domains": ["RESEARCH"],
        "keywords": ["neural architecture", "topology", "feedforward", "backpropagation", "layer", "weights", "parameter"]
    },

    # 2. Hardware, GPUs, Silicon & Data Centers
    {
        "id": "hardware-processor-silicon",
        "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Alexandre Debiève / Unsplash",
        "alt": "High performance computing microprocessor silicon board and circuit traces",
        "domains": ["HARDWARE", "INDUSTRY"],
        "keywords": ["gpu", "nvidia", "blackwell", "h100", "b200", "chip", "silicon", "semiconductor", "cuda", "amd", "intel", "tpu", "hardware", "hardware acceleration", "wafer", "fab", "tsmc"]
    },
    {
        "id": "cloud-server-rack",
        "url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Lars Kienle / Unsplash",
        "alt": "Modern enterprise cloud data center server racks and networking compute nodes",
        "domains": ["HARDWARE", "INDUSTRY"],
        "keywords": ["data center", "cloud", "cluster", "infrastructure", "server", "aws", "azure", "gcp", "supercomputer", "megawatt", "compute cluster"]
    },

    # 3. Robotics, Actuators & Autonomous Systems
    {
        "id": "robot-humanoid-torso",
        "url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Alex Knight / Unsplash",
        "alt": "Humanoid robotic torso and articulated actuator mechanism in development laboratory",
        "domains": ["RESEARCH", "INDUSTRY"],
        "keywords": ["robotics", "robot", "humanoid", "embodied", "actuator", "autonomous", "drone", "boston dynamics", "figure", "optimus", "manipulation", "locomotion"]
    },
    {
        "id": "robot-industrial-arm",
        "url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Science in HD / Unsplash",
        "alt": "Industrial robotic arm end-effector performing automated manufacturing precision tasks",
        "domains": ["RESEARCH", "INDUSTRY"],
        "keywords": ["automation", "industrial", "kuka", "robotic arm", "end-effector", "dexterous", "factory", "assembly"]
    },
    {
        "id": "robot-android-sensor",
        "url": "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Possessed Photography / Unsplash",
        "alt": "Robotic android face with optical sensory receptors",
        "domains": ["RESEARCH"],
        "keywords": ["android", "sensory", "perception", "lidar", "tactile", "bionic"]
    },
    {
        "id": "wikimedia-kuka-robots",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/KUKA_Industrial_Robots_IR.jpg",
        "source": "Wikimedia Commons",
        "license": "CC BY-SA 3.0",
        "credit": "Mixabest / Wikimedia Commons",
        "alt": "Multi-axis articulated industrial robotic arms operating on high precision line",
        "domains": ["INDUSTRY"],
        "keywords": ["industrial robotics", "manufacturing", "multi-axis", "heavy automation"]
    },

    # 4. Open Source, Code, Repositories & Software Engineering
    {
        "id": "code-editor-syntax",
        "url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Fatos Bytyqi / Unsplash",
        "alt": "Open source software source code editor displaying software development logic",
        "domains": ["OPEN_SOURCE"],
        "keywords": ["github", "repository", "python", "software", "hugging face", "open source", "open-source", "library", "sdk", "vllm", "ollama", "transformers", "pytorch"]
    },
    {
        "id": "code-ide-framework",
        "url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Florian Olivo / Unsplash",
        "alt": "Programming IDE display highlighting software engineering frameworks and algorithmic code",
        "domains": ["OPEN_SOURCE"],
        "keywords": ["developer", "framework", "toolchain", "compiler", "runtime", "package", "pip", "npm", "weights & biases", "api integration"]
    },
    {
        "id": "developer-workstation",
        "url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Enes Evren / Unsplash",
        "alt": "Modern computer workstation with developer code analysis environment",
        "domains": ["OPEN_SOURCE"],
        "keywords": ["terminal", "workstation", "devops", "script", "cli", "git"]
    },

    # 5. AI Safety, Policy, Ethics & Cybersecurity
    {
        "id": "safety-cryptographic-matrix",
        "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Markus Spiske / Unsplash",
        "alt": "Cryptographic digital matrix depicting data security and algorithmic governance",
        "domains": ["POLICY", "ETHICS"],
        "keywords": ["safety", "policy", "security", "alignment", "governance", "regulation", "nist", "watermark", "red team", "cybersecurity", "exploit", "guardrail", "jailbreak"]
    },
    {
        "id": "encryption-privacy-matrix",
        "url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Markus Spiske / Unsplash",
        "alt": "Cryptographic encryption code matrix representing digital privacy and model governance",
        "domains": ["POLICY", "ETHICS"],
        "keywords": ["privacy", "gdpr", "copyright", "licensing", "eu ai act", "compliance", "audit", "legislation", "antitrust", "white house"]
    },

    # 6. Scientific Research, Mathematics & Algorithms
    {
        "id": "research-laboratory-bench",
        "url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Science in HD / Unsplash",
        "alt": "Scientific laboratory equipment and computational research workbench",
        "domains": ["RESEARCH"],
        "keywords": ["arxiv", "paper", "theory", "academic", "mit", "csail", "experiment", "university", "journal", "peer review", "study"]
    },
    {
        "id": "math-blackboard-equations",
        "url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Roman Mager / Unsplash",
        "alt": "Mathematical and algorithmic blackboard equations for theoretical machine learning",
        "domains": ["RESEARCH"],
        "keywords": ["math", "mathematics", "algorithm", "optimization", "gradient", "loss", "cs.cl", "cs.ai", "cs.lg", "proof", "theorem", "stochastic"]
    },
    {
        "id": "nasa-deep-space-survey",
        "url": "https://images-assets.nasa.gov/image/PIA12832/PIA12832~thumb.jpg",
        "source": "NASA / JPL-Caltech",
        "license": "Public Domain",
        "credit": "NASA / JPL-Caltech",
        "alt": "Infrared astronomical deep sky survey representing computational astrophysics and data analytics",
        "domains": ["RESEARCH"],
        "keywords": ["astronomy", "astrophysics", "space", "physics", "climate", "scientific data", "cosmology"]
    },

    # 7. Enterprise Business & Industry
    {
        "id": "business-analytics-dashboard",
        "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Carlos Muza / Unsplash",
        "alt": "Enterprise analytics dashboard monitoring artificial intelligence performance and market metrics",
        "domains": ["INDUSTRY"],
        "keywords": ["business", "industry", "enterprise", "market", "startup", "venture", "revenue", "funding", "valuation", "acquisition", "commercial", "sales"]
    },

    # 8. Computer Vision & Multimodal Perception
    {
        "id": "vision-sensor-matrix",
        "url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Possessed Photography / Unsplash",
        "alt": "Digital optical lens and computer vision sensor matrix",
        "domains": ["MODEL", "RESEARCH"],
        "keywords": ["vision", "computer vision", "multimodal", "image recognition", "object detection", "vlm", "ocr", "video generation", "sora", "gen-3"]
    },

    # 9. Speech, Audio & Acoustic AI
    {
        "id": "audio-acoustic-waveform",
        "url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "Jason Rosewell / Unsplash",
        "alt": "Professional acoustic microphone and audio frequency signal waveform visualization",
        "domains": ["MODEL", "RESEARCH"],
        "keywords": ["audio", "speech", "voice", "whisper", "tts", "acoustics", "sound", "music", "elevenlabs", "voice cloning", "transcription"]
    },

    # 10. Health, Biology & Medicine
    {
        "id": "biology-cellular-microscopy",
        "url": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "National Cancer Institute / Unsplash",
        "alt": "Microscopic biological structure and molecular protein folding visualization",
        "domains": ["RESEARCH"],
        "keywords": ["biology", "health", "medical", "protein", "alphafold", "genomics", "medicine", "biotech", "drug discovery", "clinical", "cancer"]
    },
    {
        "id": "biology-cellular-modeling",
        "url": "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600&auto=format&fit=crop&q=80",
        "source": "Unsplash",
        "license": "Unsplash License",
        "credit": "National Cancer Institute / Unsplash",
        "alt": "Cellular biology imagery representing bio-computational modeling and AI in life sciences",
        "domains": ["RESEARCH"],
        "keywords": ["cellular", "dna", "crispr", "therapeutic", "bioinformatics"]
    }
]


def select_article_image(article: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """
    Selects a copyright-safe, legally verified image for an article based on
    category, title, summary, companies, and technologies.
    Returns a dictionary with image_url, image_source, image_license, image_credit, image_alt.
    """
    title = (article.get("title") or "").lower()
    content = (article.get("content") or "")[:500].lower()
    category = (article.get("category") or "").upper()
    source = (article.get("source") or "").lower()
    
    analysis = article.get("analysis") or {}
    summary = (analysis.get("summary") or "").lower()
    why_it_matters = (analysis.get("why_it_matters") or "").lower()
    companies = [c.lower() for c in (analysis.get("companies") or [])]
    technologies = [t.lower() for t in (analysis.get("technologies") or [])]

    combined_text = f"{title} {summary} {why_it_matters} {' '.join(companies)} {' '.join(technologies)} {source} {content}"

    best_match = None
    best_score = -1

    for img in VERIFIED_IMAGE_CATALOG:
        score = 0
        
        # Domain / Category affinity
        if category in img["domains"]:
            score += 2
        
        # Keyword matching
        for kw in img["keywords"]:
            if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
                # Extra weight for title or company/tech hits
                if kw in title:
                    score += 5
                elif any(kw in c for c in companies) or any(kw in t for t in technologies):
                    score += 4
                else:
                    score += 2

        if score > best_score:
            best_score = score
            best_match = img

    # If the score is sufficient, use the matched image
    if best_match and best_score >= 2:
        return {
            "image_url": best_match["url"],
            "image_source": best_match["source"],
            "image_license": best_match["license"],
            "image_credit": best_match["credit"],
            "image_alt": best_match["alt"]
        }

    # Fallback to category-based selection if score is low but category is present
    category_defaults = {
        "MODEL": VERIFIED_IMAGE_CATALOG[0],         # Neural mesh
        "OPEN_SOURCE": VERIFIED_IMAGE_CATALOG[11],   # Code syntax
        "RESEARCH": VERIFIED_IMAGE_CATALOG[16],      # Lab bench
        "HARDWARE": VERIFIED_IMAGE_CATALOG[5],       # Processor silicon
        "POLICY": VERIFIED_IMAGE_CATALOG[14],        # Safety matrix
        "ETHICS": VERIFIED_IMAGE_CATALOG[14],        # Safety matrix
        "INDUSTRY": VERIFIED_IMAGE_CATALOG[19]       # Business analytics
    }

    fallback_img = category_defaults.get(category, VERIFIED_IMAGE_CATALOG[0])
    return {
        "image_url": fallback_img["url"],
        "image_source": fallback_img["source"],
        "image_license": fallback_img["license"],
        "image_credit": fallback_img["credit"],
        "image_alt": fallback_img["alt"]
    }
