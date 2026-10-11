import json
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from backend.agent import run_agent, active_runs
from backend.config import settings
from backend.db.database import init_db, AsyncSessionLocal
from backend.db.models import RunRecord
from backend.models import TriggerRequest, AgentRunLog
from backend.observability import setup_logging, get_logger

log = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_db()
    log.info("Cardiff Demo Agent API started", mock_mode=settings.mock_mode, port=settings.api_port)
    yield
    log.info("API shutting down")


app = FastAPI(title="Cardiff Demo Agent", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "mock_mode": settings.mock_mode, "version": "1.0.0"}


@app.post("/api/agent/run")
async def trigger_run(request: TriggerRequest):
    log.info("Run triggered via API", application_id=request.application_id)
    try:
        ctx = {
            "applicant_name": request.applicant_name,
            "business_name": request.business_name,
            "loan_amount": request.loan_amount,
            "business_type": request.business_type,
        }
        run_log = await run_agent(request.application_id, cli_mode=False, applicant_context=ctx)

        async with AsyncSessionLocal() as session:
            record = RunRecord(
                run_id=run_log.run_id,
                application_id=run_log.application_id,
                started_at=run_log.started_at,
                completed_at=run_log.completed_at,
                status=run_log.status,
                decision=run_log.final_decision.recommended_action if run_log.final_decision else None,
                confidence=run_log.final_decision.confidence if run_log.final_decision else None,
                reasoning=run_log.final_decision.reasoning if run_log.final_decision else None,
                steps_json=json.dumps([s.model_dump(mode="json") for s in run_log.steps], default=str),
                mock_mode=settings.mock_mode,
            )
            session.add(record)
            await session.commit()

        return run_log.model_dump(mode="json")
    except Exception as e:
        log.error("Run failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runs")
async def list_runs():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(RunRecord).order_by(RunRecord.started_at.desc()).limit(20)
        )
        records = result.scalars().all()
        return [r.to_summary() for r in records]


@app.get("/api/runs/{run_id}")
async def get_run(run_id: str):
    if run_id in active_runs:
        return active_runs[run_id].model_dump(mode="json")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(RunRecord).where(RunRecord.run_id == run_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Run not found")
        return {
            **record.to_summary(),
            "steps": json.loads(record.steps_json or "[]"),
        }
