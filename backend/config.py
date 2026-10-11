from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    mock_mode: bool = True
    log_level: str = "INFO"

    anthropic_api_key: str = ""

    snowflake_account: str = ""
    snowflake_user: str = ""
    snowflake_password: str = ""
    snowflake_database: str = "CARDIFF_DEMO"
    snowflake_schema: str = "LENDING"
    snowflake_warehouse: str = "COMPUTE_WH"

    salesforce_username: str = ""
    salesforce_password: str = ""
    salesforce_security_token: str = ""
    salesforce_domain: str = "login"

    gmail_sender: str = ""
    gmail_app_password: str = ""
    gmail_recipient_override: str = ""

    slack_bot_token: str = ""
    slack_channel_id: str = ""

    zoom_account_id: str = ""
    zoom_client_id: str = ""
    zoom_client_secret: str = ""
    zoom_host_email: str = ""

    api_port: int = 8000
    frontend_url: str = "http://localhost:3000"


settings = Settings()
