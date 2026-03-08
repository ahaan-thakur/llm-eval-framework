# 🧪 LLM Evaluation Framework

A production-grade framework for benchmarking and comparing LLMs on accuracy, hallucination risk, tone & clarity, and response latency — powered entirely by **free-tier services**.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Dashboard│────▶│  FastAPI Backend  │────▶│   Groq API      │
│  (Vercel)       │◀────│  (Render)         │     │ (LLMs + Judge)  │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                  │
                         ┌────────▼─────────┐
                         │   Supabase DB     │
                         │   (PostgreSQL)    │
                         └──────────────────┘
```

## 📊 What Gets Evaluated

| Metric | Description | Weight |
|--------|-------------|--------|
| Accuracy | Factual correctness vs ground truth | 40% |
| Hallucination Risk | Does the model fabricate content? | 35% |
| Tone & Clarity | Clear, well-structured response? | 25% |
| Latency | Real response time (ms) | Tracked |

## 🤖 Models Compared

| Model | Params | Characteristics |
|-------|--------|-----------------|
| `llama-3.1-8b` | 8B | Fastest, lightweight |
| `gemma2-9b` | 9B | Balanced |
| `llama-3.3-70b` | 70B | Most capable |

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/llm-eval-framework
cd llm-eval-framework
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Add your GROQ_API_KEY from console.groq.com
```

### 3. Run Locally
```bash
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for the interactive API explorer.

### 4. Run an Evaluation
```bash
curl -X POST http://localhost:8000/evaluate/ \
  -H "Content-Type: application/json" \
  -d '{
    "run_name": "My First Eval",
    "test_cases": [
      {
        "question": "What is the capital of Australia?",
        "expected": "Canberra",
        "category": "factual"
      }
    ]
  }'
```

## 📁 Project Structure

```
llm-eval/
├── app/
│   ├── main.py               # FastAPI app entry point
│   ├── core/
│   │   └── config.py         # Settings & env vars
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── services/
│   │   └── groq_service.py   # LLM querying + judging logic
│   └── routers/
│       └── evaluation.py     # API endpoints
├── requirements.txt
├── render.yaml               # Render deployment config
└── .env.example
```

## 🌐 Deployment (All Free)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Render](https://render.com) | Backend hosting | 750 hrs/month |
| [Supabase](https://supabase.com) | PostgreSQL DB | 500MB storage |
| [Vercel](https://vercel.com) | Frontend hosting | Unlimited |
| [Groq](https://console.groq.com) | LLM inference | Generous free tier |

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/evaluate/` | POST | Run an evaluation |
| `/evaluate/models` | GET | List available models |
| `/evaluate/sample-test-cases` | GET | Get sample test cases |
| `/health` | GET | Health check |
| `/docs` | GET | Interactive API docs |

## 📈 Roadmap

- [x] Phase 1: Core Evaluation Engine
- [ ] Phase 2: Supabase persistence & run history
- [ ] Phase 3: React dashboard with charts
- [ ] Phase 4: Full deployment

## 👤 Author

**Ahaan Thakur** — [LinkedIn](https://linkedin.com/in/ahaan-thakur) | [GitHub](https://github.com/YOUR_USERNAME)
