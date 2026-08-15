# ArgonNews Backend Integration Guide

Welcome! This guide explains step-by-step how to connect this ArgonNews frontend to your existing Python backend without changing or rewriting your scraping, classification, or Ollama/Qwen 2.5 analysis pipeline.

---

## 1. Which Frontend Files You Need to Modify

You only ever need to configure **one file** in the frontend:

### `.env` (or environment variables)
Create a `.env` file in the frontend root (copy from `.env.example`):

```env
# URL of your Python backend API
VITE_API_BASE_URL=http://localhost:8000

# Set to "false" to connect to your real Python backend
# Set to "true" if you want to preview with mock data
VITE_USE_MOCK=false
```

> **Note:** You can also toggle between Mock Mode and Live Backend directly from the frontend UI by clicking the status badge in the header or in the **Backend Diagnostics** modal (`Terminal` icon).

---

## 2. Which Backend Endpoint the Frontend Expects

The frontend data adapter (`src/api/articles.ts`) automatically sends requests to:

```http
GET http://localhost:8000/articles
```

*(The frontend also seamlessly falls back to `/api/articles` or `/articles.json` if those are exposed).*

---

## 3. What HTTP Method is Used

- **Method:** `GET`
- **Request Headers:**
  - `Accept: application/json`
- **Response Content-Type:**
  - `application/json`

---

## 4. What JSON Response Format is Expected

The frontend expects a JSON Array containing article objects:

```json
[
  {
    "title": "DeepSeek Releases R1 Reasoning Model with Open Weights",
    "url": "https://arxiv.org/abs/2501.12948",
    "source": "DeepSeek Research",
    "source_type": "Research Lab",
    "reliability": 0.98,
    "content": "Full scraped content string...",
    "category": "Models",
    "analysis": {
      "summary": "DeepSeek released DeepSeek-R1, an open-weights reasoning model...",
      "why_it_matters": "Drastically lowers the cost and barrier of entry for frontier reasoning models...",
      "importance": 10,
      "category": "Models",
      "companies": ["DeepSeek", "High-Flyer", "NVIDIA"],
      "technologies": ["Reinforcement Learning", "MoE", "Reasoning LLMs"]
    }
  }
]
```

*(Alternatively, `{ "articles": [ ... ] }` or `{ "data": [ ... ] }` is also automatically supported).*

---

## 5. How Your Existing `articles.json` Maps to that Response

Your Python backend already produces this exact schema:

| `articles.json` Field | Frontend Usage | Required? | Fallback if missing |
| :--- | :--- | :--- | :--- |
| `title` | Article headline | Yes | `"Untitled Article"` |
| `url` | Outbound "Read Original" link | Yes | Hidden or `"#"` |
| `source` | Source publication/feed name | Yes | `"Unknown Source"` |
| `source_type` | Sub-tag (e.g. arXiv, Official) | Optional | Omitted |
| `reliability` | Accuracy confidence (0.0 – 1.0) | Optional | Default `1.0` (100%) |
| `content` | Raw text | Optional | Collapsed on demand |
| `category` | Nav filter category | Yes | `"General"` |
| `analysis.summary` | 2–3 sentence distillation | Yes | `"No summary available."` |
| `analysis.why_it_matters` | Strategic importance callout | Yes | Omitted |
| `analysis.importance` | Score 1 to 10 | Yes | Default `5` |
| `analysis.companies` | Array of involved entities | Optional | `[]` |
| `analysis.technologies` | Array of technical domains | Optional | `[]` |

---

## 6. Where to Put Your Existing Python Backend Code

Keep your existing Python scraper and analysis pipeline in your preferred folder (for example, a sibling folder `backend/` or alongside your workspace). 

Your folder structure can look like:
```text
my-argonnews-project/
├── backend/
│   ├── scraper.py          # Your existing scraping logic
│   ├── cleaner.py          # Your existing cleaning logic
│   ├── analyzer.py         # Your Ollama + Qwen 2.5 pipeline
│   ├── articles.json       # Your generated output file
│   └── server.py           # 10-line API server (see section 11)
│
└── frontend/               # This React project
    ├── src/
    ├── .env
    └── package.json
```

---

## 7. How to Start Your Python Backend

Depending on whether you use **FastAPI** or **Flask**:

### If using FastAPI:
```bash
# In your backend directory
pip install fastapi uvicorn
python server.py
# Server runs on: http://localhost:8000
```

### If using Flask:
```bash
# In your backend directory
pip install flask flask-cors
python server.py
# Server runs on: http://localhost:8000
```

---

## 8. How to Start the Frontend

```bash
# In the frontend directory
npm install
npm run dev
# Frontend runs on: http://localhost:3000
```

---

## 9. URLs and Ports Summary

| Service | Port | Local URL |
| :--- | :--- | :--- |
| **Python Backend API** | `8000` | `http://localhost:8000/articles` |
| **React Frontend UI** | `3000` | `http://localhost:3000` |

---

## 10. Required CORS Configuration

Because the frontend runs on port `3000` and your Python backend runs on port `8000`, the browser requires **CORS (Cross-Origin Resource Sharing)** headers to be enabled on your backend.

### For FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### For Flask:
```python
from flask_cors import CORS

CORS(app)  # Enables CORS for all endpoints
```

---

## 11. What to Do if Your Backend Does Not Yet Expose an API

If your Python code currently only writes to `articles.json` as a standalone script, you **do not** need to rewrite your code! 

Simply add a minimal **10-line server script** (`server.py`) in your backend folder to serve `articles.json`:

### Option A: FastAPI (`server.py`) — Recommended
```python
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ArgonNews API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/articles")
def get_articles():
    with open("articles.json", "r", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Option B: Flask (`server.py`)
```python
import json
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/articles", methods=["GET"])
def get_articles():
    with open("articles.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
```

### Option C: Instant Zero-Code Built-in Python Server
If you just want to test without writing any code:
```bash
# In the directory where articles.json lives:
python3 -m http.server 8000
```
*(The frontend adapter will automatically find `http://localhost:8000/articles.json`)*

---

## 12. Troubleshooting Connection Errors

### Error: `Network request timed out connecting to http://localhost:8000`
1. Verify your Python backend is running (`python server.py`).
2. Open `http://localhost:8000/articles` in your web browser. If you see your JSON data, the backend is active.

### Error: `Failed to fetch` or CORS error in browser console
1. Ensure you installed and configured `CORSMiddleware` (FastAPI) or `flask-cors` (Flask).
2. Check that `allow_origins=["*"]` is present.

### Error: `articles.json not found`
1. Ensure `articles.json` is located in the directory where you run `python server.py`, or use an absolute path:
   ```python
   import os
   json_path = os.path.join(os.path.dirname(__file__), "articles.json")
   ```

### Quick Diagnostic Tool inside the App
Click the **Terminal icon** in the top right header of the ArgonNews interface to open the **Diagnostic Hub**. It allows you to test-ping any endpoint live and inspect the response.
