from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers import evaluation

settings = get_settings()

app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="""
## LLM Evaluation Framework

Compare Groq-hosted LLMs on:
- ✅ **Accuracy** — Factual correctness vs ground truth
- 🔍 **Hallucination Risk** — Does the model fabricate content?
- 🗣️ **Tone & Clarity** — Is the response well-structured?
- ⚡ **Latency** — Real response time in milliseconds

### Models Evaluated
| Model | Size | Speed |
|-------|------|-------|
| llama-3.1-8b | 8B params | Fastest |
| gemma2-9b | 9B params | Fast |
| llama-3.3-70b | 70B params | Most capable |

### How It Works
1. Submit test cases with questions + expected answers
2. Each model is queried in parallel
3. A judge LLM scores each response on 3 dimensions
4. Aggregate summary + winner returned
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for development, tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(evaluation.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "app": settings.app_title,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
