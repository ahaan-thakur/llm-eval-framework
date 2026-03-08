from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class VerdictEnum(str, Enum):
    PASS = "PASS"
    PARTIAL = "PARTIAL"
    FAIL = "FAIL"


class TestCase(BaseModel):
    question: str = Field(..., description="The prompt/question to evaluate")
    expected: str = Field(..., description="Expected answer or ground truth")
    category: str = Field(default="general", description="Category: factual, technical, reasoning, etc.")


class EvaluationRequest(BaseModel):
    test_cases: list[TestCase] = Field(..., min_length=1, max_length=20)
    run_name: Optional[str] = Field(default=None, description="Optional label for this eval run")
    models: Optional[list[str]] = Field(
        default=None,
        description="Models to evaluate. Leave empty to run all 3 default models."
    )


class ModelScore(BaseModel):
    model_name: str
    response: str
    latency_ms: int
    tokens_used: int
    accuracy: float
    hallucination_risk: float
    tone_clarity: float
    verdict: VerdictEnum
    reasoning: str
    error: Optional[str] = None


class TestCaseResult(BaseModel):
    question: str
    category: str
    expected: str
    model_scores: list[ModelScore]


class ModelSummary(BaseModel):
    model_name: str
    avg_accuracy: float
    avg_hallucination_risk: float
    avg_tone_clarity: float
    avg_latency_ms: int
    pass_rate: float
    partial_rate: float
    fail_rate: float
    total_cases: int
    overall_score: float  # Weighted composite


class EvaluationResponse(BaseModel):
    run_id: str
    run_name: Optional[str]
    total_cases: int
    models_evaluated: list[str]
    results: list[TestCaseResult]
    summary: list[ModelSummary]
    winner: str
    evaluation_time_s: float
