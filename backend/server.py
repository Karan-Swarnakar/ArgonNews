import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ArgonNews API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/articles")
def get_articles():

    json_path = Path(__file__).resolve().parent.parent / "articles.json"

    with open(json_path, "r", encoding="utf-8") as file:
        return json.load(file)