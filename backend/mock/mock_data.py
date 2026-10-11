from datetime import datetime

MOCK_LOAN_APPLICATION = {
    "application_id": "APP-12345",
    "applicant_name": "Sarah Chen",
    "business_name": "Chen Logistics LLC",
    "loan_amount": 285000.00,
    "business_type": "LLC",
    "requested_at": "2026-05-28T09:15:00Z",
}

MOCK_SNOWFLAKE_RISK = {
    "application_id": "APP-12345",
    "credit_score": 718,
    "risk_score": 0.31,
    "debt_to_income": 0.28,
    "prior_defaults": 0,
    "recommended_action": "REVIEW",
}

MOCK_SALESFORCE_RECORD = {
    "contact_id": "003XXXXXXXXXXXX",
    "account_name": "Chen Logistics LLC",
    "email": "sarah.chen@chenlogistics.com",
    "phone": "(214) 555-0192",
    "existing_loans": 1,
    "relationship_tier": "EXISTING",
    "assigned_rep": "Marcus Williams",
}

MOCK_GMAIL_RESULT = {
    "status": "sent",
    "to": "marcus.williams@cardiff.co",
    "subject": "Loan Application APP-12345 — MANUAL REVIEW — Action Required",
    "message_id": "mock-msg-001",
}

MOCK_SLACK_RESULT = {
    "status": "posted",
    "channel": "C0MOCK12345",
    "ts": "1716890400.000100",
    "message": "Loan review alert posted",
}

MOCK_ZOOM_RESULT = {
    "status": "created",
    "meeting_id": "123-456-789",
    "topic": "Loan Review APP-12345 — Sarah Chen",
    "join_url": "https://zoom.us/j/123456789?pwd=mockpwd",
    "start_time": "2026-05-29T10:00:00Z",
    "duration": 30,
}
