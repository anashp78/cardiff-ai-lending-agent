from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class LoanApplication(BaseModel):
    application_id: str
    applicant_name: str
    business_name: str
    loan_amount: float
    business_type: str
    requested_at: datetime


class SnowflakeRiskData(BaseModel):
    application_id: str
    credit_score: int
    risk_score: float
    debt_to_income: float
    prior_defaults: int
    recommended_action: str  # APPROVE | REVIEW | DECLINE


class SalesforceRecord(BaseModel):
    contact_id: str
    account_name: str
    email: str
    phone: str
    existing_loans: int
    relationship_tier: str  # NEW | EXISTING | VIP
    assigned_rep: str


class AgentDecision(BaseModel):
    application_id: str
    risk_level: str  # LOW | MEDIUM | HIGH
    recommended_action: str  # APPROVE | MANUAL_REVIEW | DECLINE
    confidence: float
    reasoning: str
    next_steps: List[str]
    requires_human_review: bool


class HITLConfirmation(BaseModel):
    action: str
    payload: dict
    confirmed: bool
    confirmed_by: str
    confirmed_at: datetime


class AgentStep(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    step_id: str
    tool_called: Optional[str] = None
    input: dict
    output: dict
    model_used: str  # haiku | sonnet | none
    latency_ms: int
    timestamp: datetime


class AgentRunLog(BaseModel):
    run_id: str
    application_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[AgentStep]
    final_decision: Optional[AgentDecision] = None
    status: str  # RUNNING | AWAITING_HITL | COMPLETE | ERROR


class TriggerRequest(BaseModel):
    application_id: str
    applicant_name: Optional[str] = None
    business_name: Optional[str] = None
    loan_amount: Optional[float] = None
    business_type: Optional[str] = None


class HITLConfirmRequest(BaseModel):
    run_id: str
    action: str
    confirmed: bool
