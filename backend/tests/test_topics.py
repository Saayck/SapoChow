import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_topic(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/topics", json={"name": "Algebra", "description": "Basic algebra"}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Algebra"


async def test_list_topics(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/topics", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_get_topic_not_found(client: AsyncClient, auth_headers: dict):
    import uuid
    resp = await client.get(f"/api/topics/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404
