# ArgonNews — Frontend

> **AI intelligence, distilled.**
> High-signal intelligence dashboard for AI developments, models, research, open source releases, and policy.

This repository contains the **React 19 + TypeScript + Tailwind CSS** frontend for the **ArgonNews** AI intelligence aggregator.

---

## 🚀 Quick Start

### 1. Run with Mock Development Data (Instant)
```bash
npm install
npm run dev
```
The app will run on `http://localhost:3000` pre-loaded with realistic mock intelligence items from `src/data/mockArticles.ts`.

### 2. Connect to Your Real Python Backend
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCK=false
   ```
3. Start your Python backend (see [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)).
4. Refresh the page!

---

## 📁 Architecture Overview

```text
├── src/
│   ├── api/
│   │   └── articles.ts            # Single isolated backend adapter
│   ├── components/
│   │   ├── Header.tsx             # Brand header, search, date & live status
│   │   ├── Navigation.tsx         # Category navigation tabs
│   │   ├── FilterBar.tsx          # Importance threshold & source sorting
│   │   ├── TopDevelopments.tsx    # High-impact prioritized cards
│   │   ├── ArticleFeed.tsx        # Responsive grid feed
│   │   ├── ArticleCard.tsx        # Individual intelligence card
│   │   ├── ArticleDetailModal.tsx # Full intelligence dossier modal
│   │   ├── BackendStatusModal.tsx # Live API ping tester & integration helper
│   │   ├── ErrorBanner.tsx        # Non-blocking graceful error handler
│   │   └── LoadingSkeleton.tsx    # Pulse loading state
│   ├── data/
│   │   └── mockArticles.ts        # Development mock dataset
│   ├── types.ts                   # articles.json data schema definition
│   ├── App.tsx                    # Main layout coordinator
│   └── main.tsx                   # React root entry
│
├── .env.example                   # Environment variable template
├── BACKEND_INTEGRATION.md         # Complete backend integration guide
└── package.json
```

---

## 🔒 Data Access Isolation Guarantee
All network interactions are strictly isolated inside `src/api/articles.ts`. React UI components never call `fetch()` or `axios` directly.
