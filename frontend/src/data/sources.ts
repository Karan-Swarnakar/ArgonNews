/**
 * ArgonNews - Verified AI / ML Intelligence Sources Catalog
 * 36+ Credible primary research labs, industry pioneers, academic institutions, and technical publications.
 */

export interface SourceDefinition {
  id: string;
  name: string;
  organization: string;
  focus: string;
  category: 'Research' | 'Models' | 'Open Source' | 'Business' | 'Safety & Policy';
  source_type: 'Lab / Research' | 'Industry Publication' | 'Academic / arXiv' | 'Open Source' | 'Engineering Blog';
  reliability: number; // 0.0 - 1.0 scale
  url: string;
  feed_url?: string;
  description: string;
}

export const AI_SOURCES: SourceDefinition[] = [
  // 1. Frontier Research Labs
  {
    id: 'openai',
    name: 'OpenAI Research',
    organization: 'OpenAI',
    focus: 'Frontier LLMs, Reasoning Models, Operator, Safety',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.99,
    url: 'https://openai.com/news',
    feed_url: 'https://openai.com/news/rss.xml',
    description: 'Primary announcements, model weights, and alignment research from OpenAI.'
  },
  {
    id: 'deepmind',
    name: 'Google DeepMind',
    organization: 'Google DeepMind',
    focus: 'Gemini, AlphaFold, Reinforcement Learning, Multimodal AI',
    category: 'Research',
    source_type: 'Lab / Research',
    reliability: 0.99,
    url: 'https://deepmind.google/discover/blog/',
    feed_url: 'https://deepmind.google/blog/rss.xml',
    description: 'Fundamental research in artificial general intelligence, biology, and multimodal neural models.'
  },
  {
    id: 'google-research',
    name: 'Google Research',
    organization: 'Google',
    focus: 'Algorithms, TPU Systems, Computer Vision, Transformers',
    category: 'Research',
    source_type: 'Engineering Blog',
    reliability: 0.98,
    url: 'https://research.google/blog/',
    feed_url: 'https://research.google/blog/rss/',
    description: 'Core scientific and engineering breakthroughs across Google AI divisions.'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Research',
    organization: 'Anthropic',
    focus: 'Claude, Constitutional AI, Interpretability, Hybrid Reasoning',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.99,
    url: 'https://www.anthropic.com/research',
    feed_url: 'https://www.anthropic.com/feed.xml',
    description: 'AI safety research, mechanistic interpretability, and Claude family releases.'
  },
  {
    id: 'meta-ai',
    name: 'Meta AI Research',
    organization: 'Meta',
    focus: 'Llama Models, Open Weights, Computer Vision, FAIR',
    category: 'Open Source',
    source_type: 'Lab / Research',
    reliability: 0.97,
    url: 'https://ai.meta.com/blog/',
    feed_url: 'https://ai.meta.com/blog/rss.xml',
    description: 'Fundamental AI Research (FAIR) and open-weights foundation models.'
  },
  {
    id: 'microsoft-research',
    name: 'Microsoft Research',
    organization: 'Microsoft',
    focus: 'Phi Models, Quantum AI, Autonomous Agents, GraphRAG',
    category: 'Research',
    source_type: 'Lab / Research',
    reliability: 0.98,
    url: 'https://www.microsoft.com/en-us/research/blog/',
    feed_url: 'https://www.microsoft.com/en-us/research/feed/',
    description: 'Theoretical computer science, small language models, and agent architectures.'
  },
  {
    id: 'microsoft-ai',
    name: 'Microsoft AI',
    organization: 'Microsoft',
    focus: 'Copilot, Azure OpenAI, Enterprise AI Infrastructure',
    category: 'Business',
    source_type: 'Engineering Blog',
    reliability: 0.97,
    url: 'https://blogs.microsoft.com/ai/',
    feed_url: 'https://blogs.microsoft.com/ai/feed/',
    description: 'Commercial AI deployments, datacenter compute scale, and enterprise tools.'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA AI Blog',
    organization: 'NVIDIA',
    focus: 'Blackwell GPUs, CUDA, TensorRT-LLM, Nemotron, Physical AI',
    category: 'Business',
    source_type: 'Engineering Blog',
    reliability: 0.98,
    url: 'https://blogs.nvidia.com/blog/category/deep-learning/',
    feed_url: 'https://blogs.nvidia.com/feed/',
    description: 'AI hardware acceleration, high-performance computing, and synthetic data generation.'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Blog',
    organization: 'Hugging Face',
    focus: 'Open Source Models, Transformers, Datasets, SmolLM, Leaderboards',
    category: 'Open Source',
    source_type: 'Open Source',
    reliability: 0.98,
    url: 'https://huggingface.co/blog',
    feed_url: 'https://huggingface.co/blog/feed.xml',
    description: 'Hub of open-source machine learning, benchmarks, and community model releases.'
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI News',
    organization: 'Mistral AI',
    focus: 'Mistral Large, Pixtral, Codestral, Efficient MoE Architecture',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.98,
    url: 'https://mistral.ai/news/',
    feed_url: 'https://mistral.ai/news/rss.xml',
    description: 'European frontier AI lab producing open and commercial high-efficiency mixture-of-experts.'
  },
  {
    id: 'xai',
    name: 'xAI Research',
    organization: 'xAI',
    focus: 'Grok, Colossus Supercluster, Reasoning, Mathematical Verification',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.96,
    url: 'https://x.ai/blog',
    feed_url: 'https://x.ai/blog/rss',
    description: 'Frontier AI models emphasizing truth-seeking, massive cluster scaling, and reasoning.'
  },
  {
    id: 'cohere',
    name: 'Cohere AI Blog',
    organization: 'Cohere',
    focus: 'Command R+, Enterprise RAG, Embeddings, Multilingual NLP',
    category: 'Business',
    source_type: 'Engineering Blog',
    reliability: 0.97,
    url: 'https://cohere.com/blog',
    feed_url: 'https://cohere.com/blog/rss',
    description: 'Enterprise retrieval-augmented generation and multilingual foundation models.'
  },
  {
    id: 'amazon-ai',
    name: 'AWS Machine Learning Blog',
    organization: 'Amazon Web Services',
    focus: 'Amazon Nova, Trainium/Inferentia Silicon, Bedrock Platform',
    category: 'Business',
    source_type: 'Engineering Blog',
    reliability: 0.97,
    url: 'https://aws.amazon.com/blogs/machine-learning/',
    feed_url: 'https://aws.amazon.com/blogs/machine-learning/feed/',
    description: 'Cloud AI infrastructure, specialized silicon, and enterprise model orchestration.'
  },
  {
    id: 'apple-ml',
    name: 'Apple ML Research',
    organization: 'Apple',
    focus: 'On-Device AI, OpenELM, Ferret-UI, Neural Engine Optimization',
    category: 'Research',
    source_type: 'Lab / Research',
    reliability: 0.98,
    url: 'https://machinelearning.apple.com/research',
    feed_url: 'https://machinelearning.apple.com/rss.xml',
    description: 'Privacy-preserving edge inference, multimodal GUI agents, and compact architectures.'
  },
  {
    id: 'ibm-research',
    name: 'IBM Research AI',
    organization: 'IBM',
    focus: 'Granite Models, Trustworthy AI, Neuro-Symbolic Computing',
    category: 'Research',
    source_type: 'Lab / Research',
    reliability: 0.96,
    url: 'https://research.ibm.com/blog/category/artificial-intelligence',
    feed_url: 'https://research.ibm.com/blog/rss',
    description: 'Open enterprise foundation models, governance, and quantum-classical integration.'
  },
  {
    id: 'salesforce-research',
    name: 'Salesforce AI Research',
    organization: 'Salesforce',
    focus: 'Agentforce, Code Generation, Large Action Models (LAM)',
    category: 'Research',
    source_type: 'Lab / Research',
    reliability: 0.96,
    url: 'https://blog.salesforceairesearch.com/',
    feed_url: 'https://blog.salesforceairesearch.com/rss/',
    description: 'Autonomous enterprise workflows, tabular modeling, and tool-use optimization.'
  },
  {
    id: 'stability-ai',
    name: 'Stability AI',
    organization: 'Stability AI',
    focus: 'Stable Diffusion 3.5, Generative Video, Audio & 3D',
    category: 'Open Source',
    source_type: 'Lab / Research',
    reliability: 0.95,
    url: 'https://stability.ai/news',
    feed_url: 'https://stability.ai/news?format=rss',
    description: 'Open multimodal media generation models and diffusion architectures.'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI Blog',
    organization: 'Perplexity',
    focus: 'Conversational Search, Sonar Models, Real-time Web Synthesis',
    category: 'Models',
    source_type: 'Engineering Blog',
    reliability: 0.96,
    url: 'https://www.perplexity.ai/hub/blog',
    feed_url: 'https://www.perplexity.ai/hub/blog/rss.xml',
    description: 'Direct answer engines, live citation graph synthesis, and fine-tuned inference.'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Research',
    organization: 'DeepSeek',
    focus: 'DeepSeek-R1, DeepSeek-V3, Multi-Head Latent Attention (MLA), GRPO',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.99,
    url: 'https://www.deepseek.com/',
    feed_url: 'https://arxiv.org/rss/cs.AI',
    description: 'Breakthrough low-cost reasoning and mixture-of-experts architectures with open weights.'
  },
  {
    id: 'qwen-alibaba',
    name: 'Qwen / Alibaba Cloud',
    organization: 'Alibaba Cloud',
    focus: 'Qwen 2.5, Qwen-Coder, Math Foundation Models, Vision-Language',
    category: 'Open Source',
    source_type: 'Lab / Research',
    reliability: 0.98,
    url: 'https://qwenlm.github.io/blog/',
    feed_url: 'https://qwenlm.github.io/blog/index.xml',
    description: 'Comprehensive family of high-capability open multilingual and coding foundation models.'
  },
  {
    id: 'ai21-labs',
    name: 'AI21 Labs',
    organization: 'AI21 Labs',
    focus: 'Jamba, Hybrid SSM-Transformer Architecture, Mamba',
    category: 'Models',
    source_type: 'Lab / Research',
    reliability: 0.96,
    url: 'https://www.ai21.com/blog',
    feed_url: 'https://www.ai21.com/blog/rss.xml',
    description: 'State-space model and transformer hybrids providing ultra-long context efficiency.'
  },
  {
    id: 'databricks',
    name: 'Databricks Mosaic AI',
    organization: 'Databricks',
    focus: 'DBRX, Fine-tuning pipelines, LLMOps, Compound AI Systems',
    category: 'Business',
    source_type: 'Engineering Blog',
    reliability: 0.97,
    url: 'https://www.databricks.com/blog/category/engineering',
    feed_url: 'https://www.databricks.com/blog/feed.xml',
    description: 'High-throughput model pretraining and governed compound enterprise architectures.'
  },
  {
    id: 'together-ai',
    name: 'Together AI Research',
    organization: 'Together AI',
    focus: 'FlashAttention-3, Sub-second Inference, Speculative Decoding',
    category: 'Open Source',
    source_type: 'Engineering Blog',
    reliability: 0.97,
    url: 'https://www.together.ai/blog',
    feed_url: 'https://www.together.ai/blog/rss.xml',
    description: 'High-performance cloud GPU inference kernels and open model training.'
  },
  {
    id: 'allen-ai',
    name: 'Allen Institute for AI (AI2)',
    organization: 'Allen Institute for AI',
    focus: 'OLMo 2, Open Datasets (Dolma), Scientific AI, WildBench',
    category: 'Open Source',
    source_type: 'Lab / Research',
    reliability: 0.98,
    url: 'https://allenai.org/blog',
    feed_url: 'https://allenai.org/feed.xml',
    description: '100% truly open foundation models, weights, code, and pretraining data recipes.'
  },
  {
    id: 'eleuther-ai',
    name: 'EleutherAI',
    organization: 'EleutherAI',
    focus: 'Pythia, LM Evaluation Harness, Interpretability, Open Science',
    category: 'Research',
    source_type: 'Open Source',
    reliability: 0.97,
    url: 'https://www.eleuther.ai/news',
    feed_url: 'https://www.eleuther.ai/feed.xml',
    description: 'Non-profit AI research collective advancing open evaluation and alignment science.'
  },

  // 2. Academic AI Labs & arXiv
  {
    id: 'bair',
    name: 'Berkeley AI Research (BAIR)',
    organization: 'UC Berkeley',
    focus: 'vLLM, Reinforcement Learning, Robotics, Gorilla LLM',
    category: 'Research',
    source_type: 'Academic / arXiv',
    reliability: 0.99,
    url: 'https://bair.berkeley.edu/blog/',
    feed_url: 'https://bair.berkeley.edu/blog/feed.xml',
    description: 'University research on efficient inference, robotic manipulation, and tool use.'
  },
  {
    id: 'stanford-sail',
    name: 'Stanford AI Lab (SAIL)',
    organization: 'Stanford University',
    focus: 'Centaur, HELM Benchmarking, Foundation Model Governance',
    category: 'Research',
    source_type: 'Academic / arXiv',
    reliability: 0.99,
    url: 'https://ai.stanford.edu/blog/',
    feed_url: 'https://ai.stanford.edu/blog/feed.xml',
    description: 'Pioneering work in benchmark standardization, alignment, and medical AI.'
  },
  {
    id: 'mit-csail',
    name: 'MIT CSAIL',
    organization: 'MIT',
    focus: 'Liquid Neural Networks, Computational Biology, Robot Autonomy',
    category: 'Research',
    source_type: 'Academic / arXiv',
    reliability: 0.99,
    url: 'https://www.csail.mit.edu/news',
    feed_url: 'https://www.csail.mit.edu/rss.xml',
    description: 'Cutting-edge innovations from Computer Science and Artificial Intelligence Lab.'
  },
  {
    id: 'arxiv-ai',
    name: 'arXiv cs.AI / cs.LG / cs.CL',
    organization: 'Cornell arXiv',
    focus: 'Pre-print research papers in Artificial Intelligence and Machine Learning',
    category: 'Research',
    source_type: 'Academic / arXiv',
    reliability: 0.98,
    url: 'https://arxiv.org/corr/home',
    feed_url: 'http://export.arxiv.org/rss/cs.AI',
    description: 'The global standard repository for daily peer-submitted machine learning research papers.'
  },
  {
    id: 'papers-with-code',
    name: 'Papers with Code / HF Papers',
    organization: 'Papers with Code',
    focus: 'State of the Art Benchmarks, Reproducibility, Open Artifacts',
    category: 'Research',
    source_type: 'Academic / arXiv',
    reliability: 0.97,
    url: 'https://paperswithcode.com/',
    feed_url: 'https://paperswithcode.com/rss',
    description: 'Tracking state-of-the-art benchmarks, tasks, and accompanying implementation code.'
  },

  // 3. Technical & Industry Publications
  {
    id: 'ieee-spectrum',
    name: 'IEEE Spectrum AI',
    organization: 'IEEE',
    focus: 'Semiconductor Fabrication, Neuromorphic Chips, Robotics Standards',
    category: 'Business',
    source_type: 'Industry Publication',
    reliability: 0.96,
    url: 'https://spectrum.ieee.org/topic/artificial-intelligence/',
    feed_url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss',
    description: 'In-depth engineering analysis on chip manufacturing, photonics, and robotics.'
  },
  {
    id: 'mit-tech-review',
    name: 'MIT Technology Review AI',
    organization: 'MIT Technology Review',
    focus: 'Policy, Synthetic Data Limits, Societal Shifts, Frontier Audits',
    category: 'Safety & Policy',
    source_type: 'Industry Publication',
    reliability: 0.96,
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
    feed_url: 'https://www.technologyreview.com/feed/',
    description: 'Investigative reporting on AI breakthroughs, ethics, regulation, and capital deployment.'
  },
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    organization: 'TechCrunch',
    focus: 'Venture Capital, Frontier Startups, Compute Clusters, Deals',
    category: 'Business',
    source_type: 'Industry Publication',
    reliability: 0.94,
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    feed_url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    description: 'Market coverage of AI fundraising, startup emergence, and enterprise software acquisitions.'
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    organization: 'VentureBeat',
    focus: 'Enterprise Agent Orchestration, Governance, Model Comparison',
    category: 'Business',
    source_type: 'Industry Publication',
    reliability: 0.94,
    url: 'https://venturebeat.com/category/ai/',
    feed_url: 'https://venturebeat.com/category/ai/feed/',
    description: 'Practical adoption guides, CIO insights, and enterprise agent deployment studies.'
  },
  {
    id: 'the-verge-ai',
    name: 'The Verge AI',
    organization: 'The Verge (Vox Media)',
    focus: 'Consumer AI, Copyright Law, EU AI Act, Hardware Devices',
    category: 'Safety & Policy',
    source_type: 'Industry Publication',
    reliability: 0.93,
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    feed_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    description: 'Mainstream tech perspective on AI regulations, consumer gadgets, and intellectual property.'
  },
  {
    id: 'ars-technica-ai',
    name: 'Ars Technica AI',
    organization: 'Ars Technica',
    focus: 'Technical deep-dives, Jailbreaks, Model Vulnerabilities, Open Science',
    category: 'Safety & Policy',
    source_type: 'Industry Publication',
    reliability: 0.95,
    url: 'https://arstechnica.com/ai/',
    feed_url: 'https://feeds.arstechnica.com/arstechnica/features',
    description: 'Rigorous technical breakdowns of security vulnerabilities, benchmarks, and model safety.'
  }
];
