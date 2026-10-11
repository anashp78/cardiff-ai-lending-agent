import asyncio
from backend.mock.mock_data import (
    MOCK_SNOWFLAKE_RISK,
    MOCK_SALESFORCE_RECORD,
    MOCK_GMAIL_RESULT,
    MOCK_SLACK_RESULT,
    MOCK_ZOOM_RESULT,
)


async def mock_snowflake_query(params: dict) -> dict:
    await asyncio.sleep(0.3)
    return MOCK_SNOWFLAKE_RISK


async def mock_salesforce_query(params: dict) -> dict:
    await asyncio.sleep(0.3)
    return MOCK_SALESFORCE_RECORD


async def mock_send_gmail(params: dict) -> dict:
    await asyncio.sleep(0.2)
    result = MOCK_GMAIL_RESULT.copy()
    result["to"] = params.get("to", result["to"])
    result["subject"] = params.get("subject", result["subject"])
    return result


async def mock_post_slack(params: dict) -> dict:
    await asyncio.sleep(0.2)
    return MOCK_SLACK_RESULT


async def mock_create_zoom_meeting(params: dict) -> dict:
    await asyncio.sleep(0.2)
    result = MOCK_ZOOM_RESULT.copy()
    result["topic"] = params.get("topic", result["topic"])
    return result


MOCK_DISPATCH = {
    "snowflake_query": mock_snowflake_query,
    "salesforce_query": mock_salesforce_query,
    "send_gmail": mock_send_gmail,
    "post_slack": mock_post_slack,
    "create_zoom_meeting": mock_create_zoom_meeting,
}


async def dispatch(name: str, params: dict) -> dict:
    handler = MOCK_DISPATCH.get(name)
    if not handler:
        raise ValueError(f"No mock handler for tool: {name}")
    return await handler(params)
