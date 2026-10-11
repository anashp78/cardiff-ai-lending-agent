from backend.observability import get_logger

log = get_logger("salesforce_tool")

# Salesforce SOAP API is disabled in this org — return representative mock data
_MOCK_RECORD = {
    "contact_id": "003XXXXXXXXXXXX",
    "account_name": "Cardiff Business Client",
    "email": "contact@business.com",
    "phone": "(214) 555-0100",
    "existing_loans": 0,
    "relationship_tier": "NEW",
    "assigned_rep": "Sarah Mitchell",
}

async def query(params: dict) -> dict:
    application_id = params["application_id"]
    log.info("Salesforce CRM lookup (representative data)", application_id=application_id)
    return {**_MOCK_RECORD, "application_id": application_id}
