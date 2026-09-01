from app.models import User, EmailOTP
from app import security

def test_user_register_and_login(client, db_session):
    reg_res = client.post("/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "SecretPassword123",
        "confirm_password": "SecretPassword123"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == "test@example.com"

    db_session.expire_all()
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert user is not None
    user.is_email_verified = True
    db_session.commit()

    login_res = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "SecretPassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Test Change Password
    chg_res = client.put("/auth/change-password", headers=headers, json={
        "current_password": "SecretPassword123",
        "new_password": "NewSecretPassword456",
        "confirm_password": "NewSecretPassword456"
    })
    assert chg_res.status_code == 200

    # Login with new password
    login_new = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "NewSecretPassword456"
    })
    assert login_new.status_code == 200
    new_headers = {"Authorization": f"Bearer {login_new.json()['access_token']}"}

    # Test Forgot Password Flow
    send_otp_res = client.post("/auth/forgot-password/send-otp", json={"email": "test@example.com"})
    assert send_otp_res.status_code == 200

    db_session.expire_all()
    otp_record = db_session.query(EmailOTP).filter(EmailOTP.user_id == user.id, EmailOTP.purpose == "password_reset").first()
    assert otp_record is not None
    # Use master hash check or update otp_hash to known test value
    test_otp_hash = security.hash_otp("654321")
    otp_record.otp_hash = test_otp_hash
    db_session.commit()

    # Verify Forgot Password OTP
    verify_res = client.post("/auth/forgot-password/verify-otp", json={
        "email": "test@example.com",
        "otp": "654321"
    })
    assert verify_res.status_code == 200

    # Reset Password
    reset_res = client.post("/auth/forgot-password/reset", json={
        "email": "test@example.com",
        "otp": "654321",
        "new_password": "ResetPassword789",
        "confirm_password": "ResetPassword789"
    })
    assert reset_res.status_code == 200

    # Login after Reset
    login_reset = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "ResetPassword789"
    })
    assert login_reset.status_code == 200

    # Delete Account
    del_res = client.request("DELETE", "/auth/me", headers={"Authorization": f"Bearer {login_reset.json()['access_token']}"}, json={
        "password": "ResetPassword789"
    })
    assert del_res.status_code == 200
