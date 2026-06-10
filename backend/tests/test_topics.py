import pytest


@pytest.mark.asyncio
async def test_create_topic(client, auth_headers):
    resp = await client.post("/api/topics", json={"name": "Física", "description": "Mecánica"}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Física"
    assert data["description"] == "Mecánica"


@pytest.mark.asyncio
async def test_list_topics(client, auth_headers):
    await client.post("/api/topics", json={"name": "Química"}, headers=auth_headers)
    await client.post("/api/topics", json={"name": "Biología"}, headers=auth_headers)
    resp = await client.get("/api/topics")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_get_topic(client, auth_headers, topic):
    resp = await client.get(f"/api/topics/{topic['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == topic["id"]


@pytest.mark.asyncio
async def test_get_topic_not_found(client):
    resp = await client.get("/api/topics/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_topic(client, auth_headers, topic):
    resp = await client.put(f"/api/topics/{topic['id']}", json={"name": "Álgebra"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Álgebra"


@pytest.mark.asyncio
async def test_delete_empty_topic(client, auth_headers):
    resp = await client.post("/api/topics", json={"name": "Vacío"}, headers=auth_headers)
    topic_id = resp.json()["id"]
    del_resp = await client.delete(f"/api/topics/{topic_id}", headers=auth_headers)
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_topic_with_questions_fails(client, auth_headers, question_with_5_alts):
    topic_id = question_with_5_alts["topic_id"]
    resp = await client.delete(f"/api/topics/{topic_id}", headers=auth_headers)
    assert resp.status_code == 400
