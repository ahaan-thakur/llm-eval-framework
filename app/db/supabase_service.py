from supabase import create_client, Client
from app.core.config import get_settings
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


@lru_cache()
def get_supabase_client() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
    return create_client(settings.supabase_url, settings.supabase_key)


async def save_evaluation_run(eval_response: dict) -> str:
    """
    Persist a full evaluation run to Supabase.
    Saves: eval_runs + eval_results + model_summaries
    Returns the run_id.
    """
    db = get_supabase_client()
    run_id = eval_response["run_id"]

    # ── 1. Insert top-level run metadata ──────────────────────
    run_payload = {
        "id": run_id,
        "run_name": eval_response.get("run_name"),
        "total_cases": eval_response["total_cases"],
        "models_evaluated": eval_response["models_evaluated"],
        "winner": eval_response["winner"],
        "eval_time_s": eval_response["evaluation_time_s"],
    }
    db.table("eval_runs").insert(run_payload).execute()

    # ── 2. Insert per-case per-model results ──────────────────
    result_rows = []
    for tc in eval_response["results"]:
        for score in tc["model_scores"]:
            overall = round(
                (score.get("accuracy", 0) * 0.40) +
                (score.get("hallucination_risk", 0) * 0.35) +
                (score.get("tone_clarity", 0) * 0.25),
                2,
            )
            result_rows.append({
                "run_id": run_id,
                "question": tc["question"],
                "category": tc["category"],
                "expected": tc["expected"],
                "model_name": score["model_name"],
                "response": score.get("response", ""),
                "latency_ms": score.get("latency_ms"),
                "tokens_used": score.get("tokens_used"),
                "accuracy": score.get("accuracy"),
                "hallucination_risk": score.get("hallucination_risk"),
                "tone_clarity": score.get("tone_clarity"),
                "overall_score": overall,
                "verdict": score.get("verdict"),
                "reasoning": score.get("reasoning"),
                "error": score.get("error"),
            })

    if result_rows:
        db.table("eval_results").insert(result_rows).execute()

    # ── 3. Insert per-model summary stats ─────────────────────
    summary_rows = []
    for s in eval_response["summary"]:
        summary_rows.append({
            "run_id": run_id,
            "model_name": s["model_name"],
            "avg_accuracy": s["avg_accuracy"],
            "avg_hallucination_risk": s["avg_hallucination_risk"],
            "avg_tone_clarity": s["avg_tone_clarity"],
            "avg_latency_ms": s["avg_latency_ms"],
            "pass_rate": s["pass_rate"],
            "partial_rate": s["partial_rate"],
            "fail_rate": s["fail_rate"],
            "total_cases": s["total_cases"],
            "overall_score": s["overall_score"],
        })

    if summary_rows:
        db.table("model_summaries").insert(summary_rows).execute()

    logger.info(f"Saved evaluation run {run_id} to Supabase.")
    return run_id


async def get_all_runs(limit: int = 20, offset: int = 0) -> list[dict]:
    """Fetch paginated list of past evaluation runs, newest first."""
    db = get_supabase_client()
    response = (
        db.table("eval_runs")
        .select("id, run_name, total_cases, models_evaluated, winner, eval_time_s, created_at")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return response.data


async def get_run_by_id(run_id: str) -> dict | None:
    """Fetch a full evaluation run with all results and summaries."""
    db = get_supabase_client()

    # Fetch run metadata
    run_resp = db.table("eval_runs").select("*").eq("id", run_id).single().execute()
    if not run_resp.data:
        return None
    run = run_resp.data

    # Fetch model summaries
    summaries_resp = (
        db.table("model_summaries")
        .select("*")
        .eq("run_id", run_id)
        .order("overall_score", desc=True)
        .execute()
    )
    run["summary"] = summaries_resp.data

    # Fetch individual results
    results_resp = (
        db.table("eval_results")
        .select("*")
        .eq("run_id", run_id)
        .execute()
    )

    # Group results by question
    grouped: dict[str, dict] = {}
    for row in results_resp.data:
        q = row["question"]
        if q not in grouped:
            grouped[q] = {
                "question": q,
                "category": row["category"],
                "expected": row["expected"],
                "model_scores": [],
            }
        grouped[q]["model_scores"].append({
            "model_name": row["model_name"],
            "response": row["response"],
            "latency_ms": row["latency_ms"],
            "tokens_used": row["tokens_used"],
            "accuracy": row["accuracy"],
            "hallucination_risk": row["hallucination_risk"],
            "tone_clarity": row["tone_clarity"],
            "overall_score": row["overall_score"],
            "verdict": row["verdict"],
            "reasoning": row["reasoning"],
            "error": row["error"],
        })

    run["results"] = list(grouped.values())
    return run


async def delete_run(run_id: str) -> bool:
    """Delete an evaluation run and all associated data (cascades automatically)."""
    db = get_supabase_client()
    response = db.table("eval_runs").delete().eq("id", run_id).execute()
    return len(response.data) > 0


async def get_model_leaderboard() -> list[dict]:
    """
    Aggregate stats across ALL runs per model.
    Returns overall leaderboard sorted by average overall score.
    """
    db = get_supabase_client()
    response = db.table("model_summaries").select("*").execute()
    rows = response.data

    if not rows:
        return []

    leaderboard: dict[str, dict] = {}
    for row in rows:
        name = row["model_name"]
        if name not in leaderboard:
            leaderboard[name] = {
                "model_name": name,
                "_acc": [],
                "_hall": [],
                "_tone": [],
                "_lat": [],
                "_overall": [],
                "total_runs": 0,
                "total_cases": 0,
            }
        leaderboard[name]["_acc"].append(row["avg_accuracy"] or 0)
        leaderboard[name]["_hall"].append(row["avg_hallucination_risk"] or 0)
        leaderboard[name]["_tone"].append(row["avg_tone_clarity"] or 0)
        leaderboard[name]["_lat"].append(row["avg_latency_ms"] or 0)
        leaderboard[name]["_overall"].append(row["overall_score"] or 0)
        leaderboard[name]["total_runs"] += 1
        leaderboard[name]["total_cases"] += row["total_cases"] or 0

    result = []
    for name, data in leaderboard.items():
        result.append({
            "model_name": name,
            "avg_accuracy": round(sum(data["_acc"]) / len(data["_acc"]), 2),
            "avg_hallucination_risk": round(sum(data["_hall"]) / len(data["_hall"]), 2),
            "avg_tone_clarity": round(sum(data["_tone"]) / len(data["_tone"]), 2),
            "avg_latency_ms": int(sum(data["_lat"]) / len(data["_lat"])),
            "avg_overall_score": round(sum(data["_overall"]) / len(data["_overall"]), 2),
            "total_runs": data["total_runs"],
            "total_cases": data["total_cases"],
        })

    return sorted(result, key=lambda x: x["avg_overall_score"], reverse=True)
