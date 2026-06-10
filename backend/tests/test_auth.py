import pytest


REGISTER_PAYLOAD = {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "secret123",
}


@pytest.mark.asyncio
async def test_register_user(client):
    resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == REGISTER_PAYLOAD["email"]
    assert data["full_name"] == REGISTER_PAYLOAD["full_name"]
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": REGISTER_PAYLOAD["password"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    resp = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    login_resp = await client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": REGISTER_PAYLOAD["password"],
    })
    refresh_token = login_resp.json()["refresh_token"]
    resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
