import httpx
import base64
from datetime import datetime, timedelta
from backend.config import settings
from backend.observability import get_logger

log = get_logger("zoom_tool")


async def _get_access_token() -> str:
    credentials = f"{settings.zoom_client_id}:{settings.zoom_client_secret}"
    encoded = base64.b64encode(credentials.encode()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://zoom.us/oauth/token",
            params={
                "grant_type": "account_credentials",
                "account_id": settings.zoom_account_id,
            },
            headers={"Authorization": f"Basic {encoded}"},
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def create_meeting(params: dict) -> dict:
    topic = params.get("topic", "Loan Review Meeting")
    duration = params.get("duration", 30)

    start_time = (datetime.utcnow() + timedelta(days=1)).replace(hour=15, minute=0, second=0, microsecond=0)
    start_str = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    log.info("Creating Zoom meeting", topic=topic, start=start_str)

    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.zoom.us/v2/users/{settings.zoom_host_email}/meetings",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "topic": topic,
                "type": 2,
                "start_time": start_str,
                "duration": duration,
                "timezone": "America/Chicago",
                "settings": {"host_video": True, "participant_video": True},
            },
        )
        response.raise_for_status()
        data = response.json()

    log.info("Zoom meeting created", meeting_id=data["id"], join_url=data["join_url"])
    return {
        "status": "created",
        "meeting_id": str(data["id"]),
        "topic": data["topic"],
        "join_url": data["join_url"],
        "start_time": start_str,
        "duration": duration,
    }
