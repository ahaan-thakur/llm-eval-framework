-- ============================================================
-- LLM Evaluation Framework - Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- Project: llm-eval
-- ============================================================


-- ── Table 1: eval_runs ──────────────────────────────────────
-- Stores one row per evaluation run (top-level metadata)
CREATE TABLE IF NOT EXISTS eval_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_name      TEXT,
    total_cases   INTEGER NOT NULL,
    models_evaluated TEXT[] NOT NULL,
    winner        TEXT NOT NULL,
    eval_time_s   FLOAT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── Table 2: eval_results ───────────────────────────────────
-- Stores one row per (test_case × model) combination
CREATE TABLE IF NOT EXISTS eval_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id              UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
    question            TEXT NOT NULL,
    category            TEXT NOT NULL DEFAULT 'general',
    expected            TEXT NOT NULL,
    model_name          TEXT NOT NULL,
    response            TEXT,
    latency_ms          INTEGER,
    tokens_used         INTEGER,
    accuracy            FLOAT,
    hallucination_risk  FLOAT,
    tone_clarity        FLOAT,
    overall_score       FLOAT,
    verdict             TEXT CHECK (verdict IN ('PASS', 'PARTIAL', 'FAIL')),
    reasoning           TEXT,
    error               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── Table 3: model_summaries ─────────────────────────────────
-- Stores aggregate stats per model per run
CREATE TABLE IF NOT EXISTS model_summaries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                  UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
    model_name              TEXT NOT NULL,
    avg_accuracy            FLOAT,
    avg_hallucination_risk  FLOAT,
    avg_tone_clarity        FLOAT,
    avg_latency_ms          INTEGER,
    pass_rate               FLOAT,
    partial_rate            FLOAT,
    fail_rate               FLOAT,
    total_cases             INTEGER,
    overall_score           FLOAT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ── Indexes for fast lookups ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_eval_results_run_id ON eval_results(run_id);
CREATE INDEX IF NOT EXISTS idx_model_summaries_run_id ON model_summaries(run_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_created_at ON eval_runs(created_at DESC);


-- ── Row Level Security (RLS) ─────────────────────────────────
-- Enable RLS but allow all operations via anon key (public API)
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on eval_runs" ON eval_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on eval_results" ON eval_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on model_summaries" ON model_summaries FOR ALL USING (true) WITH CHECK (true);


-- ── Verification ─────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
