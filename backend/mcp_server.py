from backend.config import settings
from backend import mock as mock_module
from backend.mock import mock_tools
from backend.tools import snowflake_tool, salesforce_tool, gmail_tool, slack_tool, zoom_tool
from backend.observability import get_logger

log = get_logger("mcp_server")

TOOL_REGISTRY = {
    "snowflake_query": {
        "name": "snowflake_query",
        "description": "Query loan application risk data from Snowflake data warehouse",
        "input_schema": {
            "type": "object",
            "properties": {
                "application_id": {"type": "string", "description": "The loan application ID"},
                "query_type": {"type": "string", "enum": ["risk", "history", "full"], "default": "risk"},
            },
            "required": ["application_id"],
        },
        "handler": snowflake_tool.query,
    },
    "salesforce_query": {
        "name": "salesforce_query",
        "description": "Pull customer and deal records from Salesforce CRM",
        "input_schema": {
            "type": "object",
            "properties": {
                "application_id": {"type": "string", "description": "The loan application ID"},
            },
            "required": ["application_id"],
        },
        "handler": salesforce_tool.query,
    },
    "send_gmail": {
        "name": "send_gmail",
        "description": "Send a structured loan review summary email via Gmail",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
        "handler": gmail_tool.send,
    },
    "post_slack": {
        "name": "post_slack",
        "description": "Post a structured loan review alert to the Slack channel",
        "input_schema": {
            "type": "object",
            "properties": {
                "application_id": {"type": "string"},
                "applicant_name": {"type": "string"},
                "decision": {"type": "string"},
                "loan_amount": {"type": "number"},
                "credit_score": {"type": "integer"},
                "risk_score": {"type": "number"},
                "reasoning": {"type": "string"},
            },
            "required": ["application_id", "decision"],
        },
        "handler": slack_tool.post,
    },
    "create_zoom_meeting": {
        "name": "create_zoom_meeting",
        "description": "Create a Zoom meeting for loan review with the assigned rep",
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string"},
                "duration": {"type": "integer", "default": 30},
            },
            "required": ["topic"],
        },
        "handler": zoom_tool.create_meeting,
    },
}


async def call_tool(name: str, params: dict) -> dict:
    tool = TOOL_REGISTRY.get(name)
    if not tool:
        raise ValueError(f"Unknown tool: {name}")

    log.info("Tool call", tool=name, mock_mode=settings.mock_mode)

    if settings.mock_mode:
        return await mock_tools.dispatch(name, params)

    try:
        return await tool["handler"](params)
    except Exception as e:
        log.warning("Real tool failed, using mock fallback", tool=name, error=str(e))
        return await mock_tools.dispatch(name, params)


def get_tool_definitions() -> list:
    return [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["input_schema"],
        }
        for t in TOOL_REGISTRY.values()
    ]
