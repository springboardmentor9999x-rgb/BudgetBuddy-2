import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger("budgetbuddy_email")
logger.setLevel(logging.INFO)

def send_otp_email(to_email: str, otp_code: str, purpose: str = "email_verification") -> bool:
    """
    Sends 6-digit OTP code to the specified user email.
    Supports purpose="email_verification" or purpose="password_reset".
    """
    is_reset = (purpose == "password_reset")
    action_label = "Password Reset" if is_reset else "Email Verification"
    
    logger.info(f"🔑 [BUDGETBUDDY OTP GENERATED ({action_label})] To: {to_email} | OTP: {otp_code} | Expires in {settings.OTP_EXPIRE_MINUTES} mins")
    print(f"\n==================================================")
    print(f"  BUDGETBUDDY EMAIL OTP SERVICE — {action_label.upper()}")
    print(f"  To: {to_email}")
    print(f"  Your 6-Digit OTP Code is: {otp_code}")
    print(f"  Expires in: {settings.OTP_EXPIRE_MINUTES} minutes")
    print(f"==================================================\n")

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or "dummy" in settings.SMTP_PASSWORD:
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your BudgetBuddy {action_label} Code"
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email

        body_text = f"BudgetBuddy {action_label}\n\nYour 6-digit code is: {otp_code}\nThis code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n\nYour money. Your goals. Your future."
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; margin-top: 0;">BudgetBuddy</h2>
              <p style="font-size: 16px; color: #374151;">Your money. Your goals. Your future.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 15px; color: #4b5563;">Please use the following 6-digit code for <strong>{action_label}</strong>:</p>
              <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; text-align: center; padding: 15px; border-radius: 8px; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8;">{otp_code}</span>
              </div>
              <p style="font-size: 13px; color: #6b7280;">This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. If you did not request this code, please ignore this email.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(html, "html"))

        clean_password = settings.SMTP_PASSWORD.replace(" ", "")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, clean_password)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        logger.info(f"✅ OTP email successfully sent to {to_email} via SMTP")
        return True
    except Exception as e:
        logger.error(f"❌ SMTP delivery failed: {e}")
        return True
