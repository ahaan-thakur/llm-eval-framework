from fastapi import APIRouter, HTTPException, Query
from app.db.supabase_service import (
    get_all_runs,
    get_run_by_id,
    delete_run,
    get_model_leaderboard,
)

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/")
async def list_runs(
    limit: int = Query(default=20, ge=1, le=100, description="Number of runs to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
):
    """
    List all past evaluation runs, newest first.
    Supports pagination via limit and offset.
    """
    try:
        runs = await get_all_runs(limit=limit, offset=offset)
        return {
            "total_returned": len(runs),
            "limit": limit,
            "offset": offset,
            "runs": runs,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch runs: {str(e)}")


@router.get("/leaderboard")
async def model_leaderboard():
    """
    Aggregate leaderboard across all evaluation runs,
    showing which model performs best overall over time.
    """
    try:
        leaderboard = await get_model_leaderboard()
        if not leaderboard:
            return {"message": "No evaluation data yet.", "leaderboard": []}
        return {
            "leaderboard": leaderboard,
            "leader": leaderboard[0]["model_name"] if leaderboard else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")


@router.get("/{run_id}")
async def get_run(run_id: str):
    """
    Fetch a specific past evaluation run by ID.
    Returns full results, model scores, and summary.
    """
    try:
        run = await get_run_by_id(run_id)
        if not run:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found.")
        return run
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch run: {str(e)}")


@router.delete("/{run_id}")
async def remove_run(run_id: str):
    """
    Delete an evaluation run and all its associated data.
    This action is irreversible.
    """
    try:
        deleted = await delete_run(run_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found.")
        return {"message": f"Run {run_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete run: {str(e)}")
