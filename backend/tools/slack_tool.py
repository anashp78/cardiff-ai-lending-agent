from slack_sdk.web.async_client import AsyncWebClient
from backend.config import settings
from backend.observability import get_logger

log = get_logger("slack_tool")


async def post(params: dict) -> dict:
    decision = params.get("decision", "REVIEW")
    application_id = params.get("application_id", "")
    applicant_name = params.get("applicant_name", "")
    loan_amount = params.get("loan_amount", 0)
    credit_score = params.get("credit_score", 0)
    risk_score = params.get("risk_score", 0)
    reasoning = params.get("reasoning", "")

    color_map = {"APPROVE": "#16a34a", "MANUAL_REVIEW": "#ea580c", "DECLINE": "#dc2626"}
    color = color_map.get(decision, "#6b7280")

    log.info("Posting to Slack", channel=settings.slack_channel_id, decision=decision)

    client = AsyncWebClient(token=settings.slack_bot_token)

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"Loan Review: {application_id} — {decision}"},
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Applicant:*\n{applicant_name}"},
                {"type": "mrkdwn", "text": f"*Amount:*\n${loan_amount:,.0f}"},
                {"type": "mrkdwn", "text": f"*Credit Score:*\n{credit_score}"},
                {"type": "mrkdwn", "text": f"*Risk Score:*\n{risk_score:.2f}"},
            ],
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*AI Reasoning:*\n{reasoning}"},
        },
    ]

    response = await client.chat_postMessage(
        channel=settings.slack_channel_id,
        blocks=blocks,
        attachments=[{"color": color, "fallback": f"Loan review {decision}"}],
        text=f"Loan Application {application_id}: {decision}",
    )

    log.info("Slack posted", ts=response["ts"])
    return {"status": "posted", "channel": settings.slack_channel_id, "ts": response["ts"]}
