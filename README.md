# LLM Evaluation Framework

Live demo: https://llm-eval-framework-one.vercel.app

A framework for benchmarking and comparing LLMs on accuracy, hallucination risk, tone and clarity, and response latency. The core idea is simple: instead of eyeballing model outputs and guessing which one is better, this framework runs your test cases across multiple models in parallel, scores each response using an LLM-as-judge pipeline, and gives you reproducible, weighted results you can track over time.

---

## Architecture

```
React Dashboard  ──────▶  FastAPI Backend  ──────▶  Groq API
   (Vercel)      ◀──────     (Render)               (Models + Judge)
                                  │
                           Supabase DB
                           (PostgreSQL)
```

---

## What Gets Evaluated

| Metric | Description | Weight |
|--------|-------------|--------|
| Accuracy | Factual correctness against the expected answer | 40% |
| Hallucination Risk | Whether the model fabricates or adds unsupported claims | 35% |
| Tone & Clarity | How clear, structured, and appropriately toned the response is | 25% |
| Latency | Real response time in milliseconds | Tracked |

The three scored metrics are combined into a weighted overall score per model per run. The leaderboard aggregates these across all runs over time.

---

## Models

| Model | Size | Characteristics |
|-------|------|-----------------|
| `llama-3.1-8b-instant` | 8B | Fastest, lowest latency |
| `llama-3.3-70b-versatile` | 70B | Most capable, highest accuracy |
| `openai/gpt-oss-120b` | 120B | High capacity, strong reasoning |

The judge model is `llama-3.3-70b-versatile` — it scores all three models on every test case and returns structured verdict JSON.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ahaan-thakur/llm-eval-framework
cd llm-eval-framework/backend    
pip install -r requirements.txt
```

### 2. Set up environment variables

Open `.env` and fill in:

```
GROQ_API_KEY=your_key_from_console.groq.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_public_key
```

### 3. Run the backend

```bash
python -m uvicorn app.main:app --reload
```

The API will be live at `http://localhost:8000`.

### 4. Run the frontend

```bash
npm install
npm start
```

Dashboard opens at `http://localhost:3000`.

### 5. Run your first evaluation

```bash
curl -X POST http://localhost:8000/evaluate/ \
  -H "Content-Type: application/json" \
  -d '{
    "run_name": "first run",
    "test_cases": [
      {
        "question": "What is the capital of Australia?",
        "expected": "Canberra is the capital of Australia, not Sydney.",
        "category": "factual"
      }
    ]
  }'
```

Or use the dashboard — there is a "Load Sample Cases" button on the Evaluate page that pre-fills five test cases across factual, technical, and reasoning categories.

---

## Project Structure

```
llm-eval-framework/
├── backend/
│   ├── app/
│   │   ├── main.py                 
│   │   ├── core/
│   │   │   └── config.py            
│   │   ├── db/
│   │   │   └── supabase_service.py  
│   │   ├── models/
│   │   │   └── schemas.py           
│   │   ├── routers/
│   │   │   ├── evaluation.py       
│   │   │   └── history.py          
│   │   └── services/
│   │       └── groq_service.py      
│   ├── supabase_migration.sql       
│   ├── render.yaml                  
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.js                   
    │   ├── components/
    │   │   └── Sidebar.js           
    │   ├── pages/
    │   │   ├── EvaluatePage.js   
    │   │   ├── LeaderboardPage.js   
    │   │   └── HistoryPage.js       
    │   └── services/
    │       └── api.js              
    ├── package.json
    ├── vercel.json
    └── .env.example
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/evaluate/` | POST | Run an evaluation across all models |
| `/evaluate/models` | GET | List available models |
| `/evaluate/sample-test-cases` | GET | Fetch pre-built sample test cases |
| `/history/` | GET | List all past evaluation runs |
| `/history/leaderboard` | GET | Aggregate model rankings across all runs |
| `/history/{run_id}` | GET | Full detail for a specific run |
| `/history/{run_id}` | DELETE | Delete a run and all associated data |
| `/health` | GET | Health check |
| `/docs` | GET | Interactive Swagger API explorer |

---

## Deployment

Everything runs on free tiers — no credit card required.

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Render](https://render.com) | Backend hosting | 750 hours/month |
| [Supabase](https://supabase.com) | PostgreSQL database | 500MB storage |
| [Vercel](https://vercel.com) | Frontend hosting | Unlimited |
| [Groq](https://console.groq.com) | LLM inference | Generous rate limits |

To deploy, push to GitHub. Render and Vercel both connect directly to the repo and redeploy automatically on every push to main.

---

## Author

Ahaan Thakur — [LinkedIn](https://linkedin.com/in/ahaan-thakur) | [GitHub](https://github.com/ahaan-thakur)
