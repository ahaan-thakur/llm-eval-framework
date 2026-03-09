import time
import uuid
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import EvaluationRequest, EvaluationResponse
from app.services.groq_service import run_evaluation, compute_summary, AVAILABLE_MODELS
from app.db.supabase_service import save_evaluation_run

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluate", tags=["Evaluation"])


@router.post("/", response_model=EvaluationResponse)
async def evaluate_models(request: EvaluationRequest):
    """
    Run LLM evaluation across Groq models.

    - Queries each model on every test case
    - Uses LLM-as-judge to score: accuracy, hallucination risk, tone & clarity
    - Measures real latency per model
    - Returns detailed results + summary + winner
    """
    start_time = time.time()

    # Validate requested models
    if request.models:
        invalid = [m for m in request.models if m not in AVAILABLE_MODELS]
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown models: {invalid}. Available: {list(AVAILABLE_MODELS.keys())}"
            )

    # Convert pydantic models to dicts for service layer
    test_cases = [tc.model_dump() for tc in request.test_cases]

    try:
        results = await run_evaluation(test_cases, request.models)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    summary = compute_summary(results)
    winner = summary[0]["model_name"] if summary else "N/A"
    eval_time = round(time.time() - start_time, 2)

    run_id = str(uuid.uuid4())
    models_evaluated = list({
        sc["model_name"] for r in results for sc in r["model_scores"]
    })

    response_data = EvaluationResponse(
        run_id=run_id,
        run_name=request.run_name,
        total_cases=len(results),
        models_evaluated=models_evaluated,
        results=results,
        summary=summary,
        winner=winner,
        evaluation_time_s=eval_time,
    )

    # Persist to Supabase (non-blocking — don't fail the response if DB write fails)
    try:
        await save_evaluation_run(response_data.model_dump())
        logger.info(f"Run {run_id} saved to Supabase.")
    except Exception as e:
        logger.warning(f"Could not save run {run_id} to Supabase: {e}")

    return response_data


@router.get("/models")
async def list_models():
    """List all available models for evaluation."""
    return {
        "models": [
            {"name": name, "model_id": model_id}
            for name, model_id in AVAILABLE_MODELS.items()
        ]
    }


@router.get("/sample-test-cases")
async def sample_test_cases():
    """Return sample test cases to help users get started."""
    return {
        "test_cases": [
            {
                "question": "What is the capital of Australia?",
                "expected": "Canberra is the capital of Australia, not Sydney.",
                "category": "factual"
            },
            {
                "question": "Explain the difference between supervised and unsupervised learning in 3 sentences.",
                "expected": "Supervised learning trains on labeled data to predict outputs. Unsupervised learning finds patterns in unlabeled data. Examples: supervised = classification; unsupervised = clustering.",
                "category": "technical"
            },
            {
                "question": "What is 15% of 240?",
                "expected": "15% of 240 is 36.",
                "category": "reasoning"
            },
            {
                "question": "Who wrote the play Hamlet?",
                "expected": "Hamlet was written by William Shakespeare, around 1600-1601.",
                "category": "factual"
            },
            {
                "question": "What does CPU stand for and what does it do?",
                "expected": "CPU stands for Central Processing Unit. It is the primary component of a computer that executes instructions and processes data.",
                "category": "technical"
            }
        ]
    }
