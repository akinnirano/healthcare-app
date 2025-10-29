import os
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr


def _get_smtp():
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_TLS", "true").lower() in ("1", "true", "yes")
    return host, port, user, password, use_tls


def send_email(subject: str, to_email: str, html_body: str, from_name: str = "Healthcare Platform"):
    """
    Sends an email using SMTP settings from environment variables.
    Falls back to printing the email to console if SMTP is not configured.
    Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_TLS
    Optional: MAIL_FROM (default: info@hremsoftconsulting.com)
    """
    mail_from = os.getenv("MAIL_FROM", "info@hremsoftconsulting.com")
    host, port, user, pwd, use_tls = _get_smtp()

    msg = MIMEText(html_body, "html")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, mail_from))
    msg["To"] = to_email

    if not host or not user or not pwd:
        print("[Email DEBUG] SMTP not configured. Would send email:")
        print("From:", mail_from)
        print("To:", to_email)
        print("Subject:", subject)
        print(html_body)
        return

    server = smtplib.SMTP(host, port)
    try:
        if use_tls:
            server.starttls()
        server.login(user, pwd)
        server.sendmail(mail_from, [to_email], msg.as_string())
    finally:
        try:
            server.quit()
        except Exception:
            pass


