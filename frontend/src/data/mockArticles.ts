import { Article } from '../types';

/**
 * ============================================================================
 * DEVELOPMENT MOCK DATA
 * ============================================================================
 * This dataset strictly matches the schema output by the ArgonNews Python backend:
 * (Scraped sources -> Cleaned -> Ollama + Qwen 2.5 analysis -> articles.json).
 *
 * It is used for frontend development and visual previewing when the Python
 * backend API is not currently running.
 *
 * To toggle between mock data and real backend:
 * 1. Set VITE_USE_MOCK=false in your .env file, OR
 * 2. Toggle the "Data Source" switch in the header of the app.
 * ============================================================================
 */
export const MOCK_ARTICLES: Article[] = [
  {
    id: 'mock-1',
    title: 'DeepSeek Releases R1 Reasoning Model with Open Weights and Breakthrough Inference Efficiency',
    url: 'https://arxiv.org/abs/2501.12948',
    source: 'DeepSeek Research',
    source_type: 'Research Lab / arXiv',
    reliability: 0.98,
    category: 'Models',
    published_at: '2025-01-20T14:30:00Z',
    content:
      'We introduce DeepSeek-R1-Zero and DeepSeek-R1, first-generation reasoning models trained via large-scale reinforcement learning without prior supervised fine-tuning as an initial step. DeepSeek-R1 achieves performance comparable to OpenAI-o1 on mathematics, code, and logical reasoning benchmarks while dramatically reducing training compute and inference overhead...',
    analysis: {
      summary:
        'DeepSeek released DeepSeek-R1, an open-weights reasoning model matching frontier closed models in math and coding benchmarks. The model demonstrates that pure reinforcement learning can cultivate advanced self-correction and reasoning behaviors at a fraction of traditional training costs.',
      why_it_matters:
        'Drastically lowers the cost and barrier of entry for frontier reasoning models, challenging the proprietary moat of closed-source labs and shifting hardware utilization economics toward high-efficiency inference.',
      importance: 10,
      category: 'Models',
      companies: ['DeepSeek', 'High-Flyer', 'NVIDIA'],
      technologies: ['Reinforcement Learning', 'Mixture-of-Experts (MoE)', 'Reasoning LLMs', 'Group Relative Policy Optimization (GRPO)']
    }
  },
  {
    id: 'mock-2',
    title: 'Anthropic Introduces Hybrid Reasoning and Compute Controls in Claude 3.7 Sonnet',
    url: 'https://anthropic.com/news/claude-3-7-sonnet',
    source: 'Anthropic Engineering Blog',
    source_type: 'Official Lab Release',
    reliability: 0.99,
    category: 'Research',
    published_at: '2025-02-24T09:00:00Z',
    content:
      'Claude 3.7 Sonnet is the first hybrid reasoning model on the market, offering users the ability to dynamically scale thinking time for complex coding and analytical tasks or respond instantaneously for standard workflows. We provide developers with an explicit API budget parameter to control thought tokens...',
    analysis: {
      summary:
        'Anthropic launched Claude 3.7 Sonnet, introducing a unified architecture combining instant response generation with adjustable chain-of-thought compute budgets. Developers can dial in exact reasoning limits per request depending on latency and budget requirements.',
      why_it_matters:
        'Solves the trade-off between fast conversational models and heavy reasoning engines, setting a new paradigm for flexible enterprise software integration and autonomous agent orchestration.',
      importance: 9,
      category: 'Research',
      companies: ['Anthropic', 'Amazon AWS', 'Google Cloud'],
      technologies: ['Hybrid Reasoning', 'Adaptive Compute', 'Chain of Thought', 'Agentic Workflows']
    }
  },
  {
    id: 'mock-3',
    title: 'Meta Releases Llama 3.3 70B: Matching Previous 405B Capabilities with 5x Lower Footprint',
    url: 'https://ai.meta.com/blog/llama-3-3-open-weights',
    source: 'Meta AI Blog',
    source_type: 'Industry Research',
    reliability: 0.96,
    category: 'Open Source',
    published_at: '2024-12-06T17:00:00Z',
    content:
      'Llama 3.3 70B delivers the industry-leading intelligence of our previous flagship 405B model in a highly accessible 70-billion parameter size. It incorporates advanced distillation pipelines, synthetic data filtering, and optimized quantization schemes...',
    analysis: {
      summary:
        'Meta unveiled Llama 3.3 70B, which matches the benchmark performance of the previous 405B model while fitting on a single enterprise GPU node or consumer multi-GPU setup through dense architectural refinement and knowledge distillation.',
      why_it_matters:
        'Makes tier-1 model capabilities commercially viable on commodity hardware for on-premise enterprise deployments and private edge applications.',
      importance: 8,
      category: 'Open Source',
      companies: ['Meta', 'Hugging Face', 'Ollama'],
      technologies: ['Knowledge Distillation', 'Quantization (FP8/4-bit)', 'Instruction Tuning', 'Open Weights']
    }
  },
  {
    id: 'mock-4',
    title: 'OpenAI Previews Operator and Computer-Using Agent Standards for Browser Automation',
    url: 'https://openai.com/index/introducing-operator',
    source: 'OpenAI Research',
    source_type: 'Product Announcement',
    reliability: 0.97,
    category: 'Business',
    published_at: '2025-01-23T11:15:00Z',
    content:
      'Operator is our new autonomous agent capability capable of navigating graphical user interfaces, executing multi-step web tasks, booking travel, and filling complex enterprise forms directly inside a sandboxed Chromium environment...',
    analysis: {
      summary:
        'OpenAI rolled out Operator, an autonomous graphical agent that interacts directly with browser interfaces and web applications using visual perception and OS-level keyboard/mouse actions.',
      why_it_matters:
        'Transitions generative AI from informational chatbots into actionable workflow executioners that can operate legacy web software without requiring specialized API integrations.',
      importance: 8,
      category: 'Business',
      companies: ['OpenAI', 'Microsoft'],
      technologies: ['GUI Grounding', 'Computer-Using Agents (CUA)', 'Visual Language Models', 'Action Tokens']
    }
  },
  {
    id: 'mock-5',
    title: 'US and EU AI Safety Institutes Establish Joint Technical Testing Protocols for Frontier Models',
    url: 'https://nist.gov/aisi/us-eu-joint-evaluation-framework',
    source: 'NIST / US AI Safety Institute',
    source_type: 'Government & Standards Body',
    reliability: 0.95,
    category: 'Safety & Policy',
    published_at: '2025-02-12T16:00:00Z',
    content:
      'The US AI Safety Institute at NIST and the European AI Office have signed a memorandum establishing standardized red-teaming methodologies for dual-use foundation models, focusing on cybersecurity vulnerabilities, autonomous replication risks, and chemical-biological synthesis safeguards...',
    analysis: {
      summary:
        'Government safety institutes in the US and Europe released unified pre-deployment evaluation criteria to measure catastrophic risk vectors and biological/cyber capability thresholds in advanced AI models.',
      why_it_matters:
        'Establishes cross-border regulatory compliance benchmarks that frontier AI developers must fulfill prior to widespread commercial deployment, stabilizing international safety governance.',
      importance: 7,
      category: 'Safety & Policy',
      companies: ['NIST AISI', 'European AI Office', 'UK AISI'],
      technologies: ['Model Red-Teaming', 'Cyber-Capability Auditing', 'Dual-Use Risk Evaluation', 'Alignment Standards']
    }
  }
];
