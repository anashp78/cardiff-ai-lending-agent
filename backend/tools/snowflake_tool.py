import os
import snowflake.connector
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from backend.config import settings
from backend.observability import get_logger

log = get_logger("snowflake_tool")

_KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "cardiff_rsa_key.p8")


def _load_private_key():
    with open(os.path.abspath(_KEY_PATH), "rb") as f:
        return load_pem_private_key(f.read(), password=None)


async def query(params: dict) -> dict:
    application_id = params["application_id"]

    log.info("Querying Snowflake", application_id=application_id)

    conn = snowflake.connector.connect(
        account=settings.snowflake_account,
        user=settings.snowflake_user,
        private_key=_load_private_key(),
        database=settings.snowflake_database,
        schema=settings.snowflake_schema,
        warehouse=settings.snowflake_warehouse,
        role="PUBLIC",
    )

    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT application_id, credit_score, risk_score, debt_to_income,
                   prior_defaults, recommended_action
            FROM loan_applications
            WHERE application_id = %s
            """,
            (application_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"No Snowflake record found for {application_id}")

        result = {
            "application_id": row[0],
            "credit_score": row[1],
            "risk_score": float(row[2]),
            "debt_to_income": float(row[3]),
            "prior_defaults": row[4],
            "recommended_action": row[5],
        }
        log.info("Snowflake query complete", credit_score=result["credit_score"], risk_score=result["risk_score"])
        return result
    finally:
        conn.close()
