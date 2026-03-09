import asyncio
import time
import json
import re
from groq import AsyncGroq
from app.core.config import get_settings

settings = get_settings()

AVAILABLE_MODELS = {
    "llama-3.1-8b": "llama-3.1-8b-instant",
    "llama-3.3-70b": "llama-3.3-70b-versatile",
    "llama-prompt-guard-2-86m": "llama-prompt-guard-2-86m",
}

JUDGE_MODEL = "llama-3.3-70b-versatile"

JUDGE_PROMPT_TEMPLATE = """You are a strict and impartial LLM evaluator. Your job is to assess how well a model answered a question.

Question: {question}
Expected Answer / Ground Truth: {expected}
Model Response: {response}

Score the response on each dimension from 0 to 10:
- accuracy: How factually correct is the response vs the expected answer? (0=completely wrong, 10=perfectly correct)
- hallucination_risk: Does the model fabricate or add unsupported claims? (0=severe hallucination, 10=grounded and factual)
- tone_clarity: Is the response clear, well-structured, and appropriately toned? (0=confusing/inappropriate, 10=excellent)

Also provide:
- verdict: "PASS" if accuracy >= 7, "PARTIAL" if 4-6, "FAIL" if <= 3
- reasoning: 1-2 sentence explanation of your evaluation

Respond ONLY with valid JSON. No extra text, no markdown fences:
{{"accuracy": <int>, "hallucination_risk": <int>, "tone_clarity": <int>, "verdict": "<PASS|PARTIAL|FAIL>", "reasoning": "<string>"}}"""


async def query_model(client: AsyncGroq, model_id: str, prompt: str) -> dict:
    """Query a single model and capture response + latency."""
    start = time.time()
    try:
        response = await client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.3,
        )
        latency_ms = int((time.time() - start) * 1000)
        return {
            "response": response.choices[0].message.content.strip(),
            "latency_ms": latency_ms,
            "tokens_used": response.usage.total_tokens,
            "error": None,
        }
    except Exception as e:
        return {
            "response": "",
            "latency_ms": -1,
            "tokens_used": 0,
            "error": str(e),
        }


async def judge_response(client: AsyncGroq, question: str, expected: str, response: str) -> dict:
    """Use LLM-as-judge to score a model response."""
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question,
        expected=expected,
        response=response,
    )
    result = await query_model(client, JUDGE_MODEL, prompt)

    if result["error"]:
        return _default_scores(f"Judge error: {result['error']}")

    try:
        raw = result["response"]
        match = re.search(r'\{[\s\S]*?\}', raw)
        if match:
            scores = json.loads(match.group())
            # Validate all required keys exist
            required = ["accuracy", "hallucination_risk", "tone_clarity", "verdict", "reasoning"]
            if all(k in scores for k in required):
                return scores
    except (json.JSONDecodeError, KeyError):
        pass

    return _default_scores("Could not parse judge response.")


def _default_scores(reason: str) -> dict:
    return {
        "accuracy": 5,
        "hallucination_risk": 5,
        "tone_clarity": 5,
        "verdict": "PARTIAL",
        "reasoning": reason,
    }


async def evaluate_single_case(client: AsyncGroq, model_name: str, model_id: str, test_case: dict) -> dict:
    """Evaluate one model on one test case: query + judge."""
    # Step 1: Get model response
    model_result = await query_model(client, model_id, test_case["question"])

    # Step 2: Judge the response (skip if model errored)
    if model_result["error"]:
        scores = {
            "accuracy": 0,
            "hallucination_risk": 0,
            "tone_clarity": 0,
            "verdict": "FAIL",
            "reasoning": f"Model query failed: {model_result['error']}",
        }
    else:
        scores = await judge_response(
            client,
            test_case["question"],
            test_case["expected"],
            model_result["response"],
        )

    return {
        "model_name": model_name,
        "response": model_result["response"],
        "latency_ms": model_result["latency_ms"],
        "tokens_used": model_result["tokens_used"],
        "error": model_result["error"],
        **scores,
    }


async def run_evaluation(test_cases: list[dict], selected_models: list[str] | None = None) -> list[dict]:
    """
    Run full evaluation across all models and test cases.
    Returns list of per-test-case results with all model scores.
    """
    client = AsyncGroq(api_key=settings.groq_api_key)

    # Determine which models to run
    models_to_run = {}
    if selected_models:
        for name in selected_models:
            if name in AVAILABLE_MODELS:
                models_to_run[name] = AVAILABLE_MODELS[name]
    else:
        models_to_run = AVAILABLE_MODELS

    all_results = []

    for tc in test_cases:
        # Run all models concurrently for this test case
        tasks = [
            evaluate_single_case(client, name, model_id, tc)
            for name, model_id in models_to_run.items()
        ]
        model_scores = await asyncio.gather(*tasks)

        all_results.append({
            "question": tc["question"],
            "category": tc.get("category", "general"),
            "expected": tc["expected"],
            "model_scores": list(model_scores),
        })

    return all_results


def compute_summary(results: list[dict]) -> list[dict]:
    """Compute per-model aggregate statistics across all test cases."""
    model_data: dict[str, list] = {}

    for tc in results:
        for score in tc["model_scores"]:
            name = score["model_name"]
            if name not in model_data:
                model_data[name] = []
            model_data[name].append(score)

    summaries = []
    for model_name, cases in model_data.items():
        valid_latency = [c["latency_ms"] for c in cases if c["latency_ms"] > 0]
        avg_acc = round(sum(c["accuracy"] for c in cases) / len(cases), 2)
        avg_hall = round(sum(c["hallucination_risk"] for c in cases) / len(cases), 2)
        avg_tone = round(sum(c["tone_clarity"] for c in cases) / len(cases), 2)
        avg_lat = int(sum(valid_latency) / len(valid_latency)) if valid_latency else -1

        pass_count = sum(1 for c in cases if c["verdict"] == "PASS")
        partial_count = sum(1 for c in cases if c["verdict"] == "PARTIAL")
        fail_count = sum(1 for c in cases if c["verdict"] == "FAIL")
        total = len(cases)

        # Weighted composite: accuracy 40%, hallucination 35%, tone 25%
        overall = round((avg_acc * 0.40) + (avg_hall * 0.35) + (avg_tone * 0.25), 2)

        summaries.append({
            "model_name": model_name,
            "avg_accuracy": avg_acc,
            "avg_hallucination_risk": avg_hall,
            "avg_tone_clarity": avg_tone,
            "avg_latency_ms": avg_lat,
            "pass_rate": round(pass_count / total * 100, 1),
            "partial_rate": round(partial_count / total * 100, 1),
            "fail_rate": round(fail_count / total * 100, 1),
            "total_cases": total,
            "overall_score": overall,
        })

    return sorted(summaries, key=lambda x: x["overall_score"], reverse=True)
