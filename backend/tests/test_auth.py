import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "new@test.com",
        "password": "pass1234",
    })
    assert resp.status_code == 201
    assert resp.json()["username"] == "newuser"


async def test_register_duplicate_username(client: AsyncClient):
    payload = {"username": "dupuser", "email": "dup1@test.com", "password": "pass1234"}
    await client.post("/api/auth/register", json=payload)
    payload["email"] = "dup2@test.com"
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


async def test_login_success(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "username": "loginuser",
        "email": "login@test.com",
        "password": "mypassword",
    })
    resp = await client.post("/api/auth/login", json={"username": "loginuser", "password": "mypassword"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert "refresh_token" in resp.json()


async def test_login_wrong_password(client: AsyncClient):
    resp = await client.post("/api/auth/login", json={"username": "loginuser", "password": "wrongpass"})
    assert resp.status_code == 401
