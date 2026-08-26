import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_and_verify(client, db_session, full_name, email, password):
    client.post("/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": password,
        "confirm_password": password
    })
    db_session.expire_all()
    user = db_session.query(User).filter(User.email == email).first()
    if user:
        user.is_email_verified = True
        db_session.commit()

    res = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_a_headers(client, db_session):
    return register_and_verify(client, db_session, "User Alpha", "user_a@example.com", "Password123")


@pytest.fixture
def user_b_headers(client, db_session):
    return register_and_verify(client, db_session, "User Beta", "user_b@example.com", "Password123")
