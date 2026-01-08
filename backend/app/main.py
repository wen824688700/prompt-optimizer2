import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import feedback, frameworks, prompts, quota, versions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Prompt Optimizer API",
    description="基于 57 个 Prompt 工程框架的智能提示词优化工具",
    version="0.1.0",
)

default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

env_origins_raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if env_origins_raw:
    env_origins = [o.strip() for o in env_origins_raw.split(",") if o.strip()]
else:
    env_origins = []
allow_origins = env_origins or default_origins

_origin_regex_raw = os.getenv("CORS_ALLOW_ORIGIN_REGEX")
if _origin_regex_raw is None:
    allow_origin_regex: str | None = r"https://.*\.vercel\.app"
else:
    _origin_regex_raw = _origin_regex_raw.strip()
    allow_origin_regex = None if _origin_regex_raw in {"", "none", "null"} else _origin_regex_raw

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feedback.router)
app.include_router(frameworks.router)
app.include_router(prompts.router)
app.include_router(quota.router)
app.include_router(versions.router)


@app.get("/")
async def root():
    return {"message": "Prompt Optimizer API", "version": "0.1.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/health")
async def api_health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
