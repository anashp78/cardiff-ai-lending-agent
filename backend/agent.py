import asyncio
import argparse
import json
import time
import uuid
from datetime import datetime

import anthropic

from backend.config import settings
from backend.models import (
    AgentDecision,
    AgentRunLog,
    AgentStep,
    LoanApplication,
    SnowflakeRiskData,
    SalesforceRecord,
)
from backend.mcp_server import call_tool
from backend.observability import get_logger, setup_logging
from backend.mock.mock_data import MOCK_LOAN_APPLICATION

log = get_logger("agent")

active_runs: dict[str, AgentRunLog] = {}


def _make_step(tool: str | None, model: str, input_data: dict, output_data: dict, start_ms: float) -> AgentStep:
    return AgentStep(
        step_id=str(uuid.uuid4())[:8],
        tool_called=tool,
        input=input_data,
        output=output_data,
        model_used=model,
        latency_ms=int((time.time() * 1000) - start_ms),
        timestamp=datetime.utcnow(),
    )


def _hitl_prompt(action: str, payload: dict) -> bool:
    print(f"\n{'='*60}")
    print(f"  HITL CONFIRMATION REQUIRED")
    print(f"  Action : {action}")
    print(f"  Payload: {json.dumps(payload, indent=2, default=str)}")
    print(f"{'='*60}")
    answer = input("  Confirm? [y/N] > ").strip().lower()
    confirmed = answer in ("y", "yes")
    print(f"  {'CONFIRMED' if confirmed else 'SKIPPED'}\n")
    return confirmed


async def run_agent(application_id: str, cli_mode: bool = False, applicant_context: dict | None = None) -> AgentRunLog:
    run_id = str(uuid.uuid4())[:12]
    started_at = datetime.utcnow()
    steps: list[AgentStep] = []

    log.info("Agent run started", run_id=run_id, application_id=application_id, mock_mode=settings.mock_mode)

    run_log = AgentRunLog(
        run_id=run_id,
        application_id=application_id,
        started_at=started_at,
        steps=steps,
        status="RUNNING",
    )
    active_runs[run_id] = run_log

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    if settings.mock_mode:
        app_data = MOCK_LOAN_APPLICATION
    else:
        ctx = applicant_context or {}
        app_data = {
            "application_id": application_id,
            "applicant_name": ctx.get("applicant_name") or "Unknown",
            "business_name": ctx.get("business_name") or "Unknown",
            "loan_amount": ctx.get("loan_amount") or 0,
            "business_type": ctx.get("business_type") or "Unknown",
        }
    application = LoanApplication(
        application_id=app_data["application_id"],
        applicant_name=app_data.get("applicant_name", "Unknown"),
        business_name=app_data.get("business_name", "Unknown"),
        loan_amount=float(app_data.get("loan_amount", 0)),
        business_type=app_data.get("business_type", "Unknown"),
        requested_at=datetime.fromisoformat(app_data.get("requested_at", datetime.utcnow().isoformat()).replace("Z", "+00:00")),
    )

    # STEP 1 — Classification (Haiku)
    log.info("Step 1: Classifying application", model="haiku")
    t = time.time() * 1000
    classify_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": (
                f"Classify this loan application for initial risk routing.\n"
                f"Application ID: {application.application_id}\n"
                f"Applicant: {application.applicant_name}\n"
                f"Business: {application.business_name}\n"
                f"Amount: ${application.loan_amount:,.0f}\n"
                f"Business Type: {application.business_type}\n\n"
                f"Respond with JSON only: {{\"risk_level\": \"LOW|MEDIUM|HIGH\", \"route_to\": \"auto_approve|manual_review|decline\"}}"
            ),
        }],
    )
    classify_text = classify_response.content[0].text.strip()
    try:
        classify_json = json.loads(classify_text)
    except Exception:
        classify_json = {"risk_level": "MEDIUM", "route_to": "manual_review"}

    steps.append(_make_step(None, "haiku", {"application_id": application_id}, classify_json, t))
    log.info("Step 1 complete", risk_level=classify_json.get("risk_level"), route=classify_json.get("route_to"))

    # STEP 2 — Snowflake data pull
    log.info("Step 2: Pulling Snowflake risk data")
    t = time.time() * 1000
    sf_raw = await call_tool("snowflake_query", {"application_id": application_id})
    risk_data = SnowflakeRiskData(**sf_raw)
    steps.append(_make_step("snowflake_query", "haiku", {"application_id": application_id}, sf_raw, t))
    log.info("Step 2 complete", credit_score=risk_data.credit_score, risk_score=risk_data.risk_score)

    # STEP 3 — Salesforce data pull
    log.info("Step 3: Pulling Salesforce CRM record")
    t = time.time() * 1000
    crm_raw = await call_tool("salesforce_query", {"application_id": application_id})
    crm_data = SalesforceRecord(**crm_raw)
    steps.append(_make_step("salesforce_query", "haiku", {"application_id": application_id}, crm_raw, t))
    log.info("Step 3 complete", account=crm_data.account_name, tier=crm_data.relationship_tier)

    # STEP 4 — Decision reasoning (Sonnet)
    log.info("Step 4: Reasoning with Sonnet")
    t = time.time() * 1000
    reasoning_prompt = (
        f"You are a senior loan analyst AI. Evaluate this application and produce a structured decision.\n\n"
        f"Application:\n"
        f"  ID: {application.application_id}\n"
        f"  Applicant: {application.applicant_name}\n"
        f"  Business: {application.business_name} ({application.business_type})\n"
        f"  Loan Amount: ${application.loan_amount:,.0f}\n\n"
        f"Snowflake Risk Data:\n"
        f"  Credit Score: {risk_data.credit_score}\n"
        f"  Risk Score: {risk_data.risk_score} (0=safe, 1=high risk)\n"
        f"  Debt-to-Income: {risk_data.debt_to_income}\n"
        f"  Prior Defaults: {risk_data.prior_defaults}\n"
        f"  System Recommendation: {risk_data.recommended_action}\n\n"
        f"Salesforce CRM:\n"
        f"  Account: {crm_data.account_name}\n"
        f"  Relationship Tier: {crm_data.relationship_tier}\n"
        f"  Existing Loans: {crm_data.existing_loans}\n"
        f"  Assigned Rep: {crm_data.assigned_rep}\n\n"
        f"Respond with JSON only:\n"
        f'{{"risk_level": "LOW|MEDIUM|HIGH", "recommended_action": "APPROVE|MANUAL_REVIEW|DECLINE", '
        f'"confidence": 0.0-1.0, "reasoning": "...", "next_steps": ["...", "..."], "requires_human_review": true|false}}'
    )

    decision_response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": reasoning_prompt}],
    )
    decision_text = decision_response.content[0].text.strip()
    if decision_text.startswith("```"):
        decision_text = decision_text.split("```")[1]
        if decision_text.startswith("json"):
            decision_text = decision_text[4:]

    try:
        decision_json = json.loads(decision_text.strip())
    except Exception:
        decision_json = {
            "risk_level": "MEDIUM",
            "recommended_action": "MANUAL_REVIEW",
            "confidence": 0.7,
            "reasoning": "Parsed fallback — moderate risk, manual review recommended.",
            "next_steps": ["Schedule rep call", "Request additional documentation"],
            "requires_human_review": True,
        }

    decision = AgentDecision(application_id=application_id, **decision_json)
    steps.append(_make_step(None, "sonnet", {"prompt_summary": "full context reasoning"}, decision_json, t))
    log.info("Step 4 complete", action=decision.recommended_action, confidence=decision.confidence)

    run_log.final_decision = decision
    run_log.status = "AWAITING_HITL"

    # STEP 5+6 — HITL + Execute actions
    email_body = (
        f"<h2>Loan Application Review: {application.application_id}</h2>"
        f"<p><b>Applicant:</b> {application.applicant_name} — {application.business_name}</p>"
        f"<p><b>Amount:</b> ${application.loan_amount:,.0f}</p>"
        f"<p><b>Decision:</b> {decision.recommended_action} (confidence: {decision.confidence:.0%})</p>"
        f"<p><b>Credit Score:</b> {risk_data.credit_score} &nbsp;|&nbsp; <b>Risk Score:</b> {risk_data.risk_score}</p>"
        f"<p><b>Reasoning:</b> {decision.reasoning}</p>"
        f"<p><b>Next Steps:</b> {', '.join(decision.next_steps)}</p>"
    )

    actions = [
        ("send_gmail", {
            "to": crm_data.email or "team@cardiff.co",
            "subject": f"Loan Application {application_id} — {decision.recommended_action} — Action Required",
            "body": email_body,
        }),
        ("post_slack", {
            "application_id": application_id,
            "applicant_name": application.applicant_name,
            "decision": decision.recommended_action,
            "loan_amount": application.loan_amount,
            "credit_score": risk_data.credit_score,
            "risk_score": risk_data.risk_score,
            "reasoning": decision.reasoning,
        }),
        ("create_zoom_meeting", {
            "topic": f"Loan Review {application_id} — {application.applicant_name}",
            "duration": 30,
        }),
    ]

    for action_name, action_payload in actions:
        if cli_mode:
            confirmed = _hitl_prompt(action_name, action_payload)
        else:
            confirmed = True  # Web mode: confirmed via /api/hitl/confirm endpoint

        t = time.time() * 1000
        if confirmed:
            result = await call_tool(action_name, action_payload)
            log.info("Action executed", action=action_name, result=result)
        else:
            result = {"status": "skipped", "reason": "user declined"}
            log.info("Action skipped", action=action_name)

        steps.append(_make_step(action_name, "none", action_payload, result, t))

    # STEP 7 — Finalize
    run_log.completed_at = datetime.utcnow()
    run_log.status = "COMPLETE"
    run_log.steps = steps

    log.info(
        "Agent run complete",
        run_id=run_id,
        decision=decision.recommended_action,
        steps=len(steps),
        duration_ms=int((run_log.completed_at - started_at).total_seconds() * 1000),
    )

    return run_log


if __name__ == "__main__":
    setup_logging()

    parser = argparse.ArgumentParser(description="Cardiff Demo Agent CLI")
    parser.add_argument("--application-id", default="APP-12345", help="Loan application ID to process")
    args = parser.parse_args()

    result = asyncio.run(run_agent(args.application_id, cli_mode=True))

    print("\n" + "="*60)
    print("  AGENT RUN COMPLETE")
    print("="*60)
    print(json.dumps(result.model_dump(mode="json"), indent=2, default=str))
