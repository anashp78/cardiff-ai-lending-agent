import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from backend.config import settings
from backend.observability import get_logger

log = get_logger("gmail_tool")


async def send(params: dict) -> dict:
    to = settings.gmail_recipient_override or params["to"]
    subject = params["subject"]
    body = params["body"]

    log.info("Sending Gmail", to=to, subject=subject)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.gmail_sender
    msg["To"] = to
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.gmail_sender, settings.gmail_app_password)
        server.sendmail(settings.gmail_sender, to, msg.as_string())

    log.info("Gmail sent", to=to)
    return {"status": "sent", "to": to, "subject": subject}
