"""Servicio de envío de emails vía SMTP."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings


settings = get_settings()


class EmailService:
    """Envía emails usando SMTP."""

    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password
        self.use_tls = settings.smtp_use_tls
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name

    def _get_server(self) -> smtplib.SMTP:
        """Conecta al servidor SMTP."""
        if not self.host or not self.username or not self.password:
            raise ValueError("SMTP configuration is incomplete. Check .env file.")

        server = smtplib.SMTP(self.host, self.port)
        if self.use_tls:
            server.starttls()
        server.login(self.username, self.password)
        return server

    def send_email(
        self,
        to_emails: list[str],
        subject: str,
        html_content: str,
    ) -> bool:
        """Envía un email a múltiples destinatarios."""
        if not to_emails:
            return False

        try:
            server = self._get_server()

            for to_email in to_emails:
                msg = MIMEMultipart("alternative")
                msg["From"] = f"{self.from_name} <{self.from_email}>"
                msg["To"] = to_email
                msg["Subject"] = subject

                html_part = MIMEText(html_content, "html")
                msg.attach(html_part)

                server.sendmail(self.from_email, to_email, msg.as_string())

            server.quit()
            return True

        except Exception as e:
            # Log error but don't crash the application
            import logging
            logging.error(f"Failed to send email: {e}")
            return False
