import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

FIVE_ALTS = [
    {"content": "Alt A", "is_correct": True,  "default_order": 0},
    {"content": "Alt B", "is_correct": False, "default_order": 1},
    {"content": "Alt C", "is_correct": False, "default_order": 2},
    {"content": "Alt D", "is_correct": False, "default_order": 3},
    {"content": "Alt E", "is_correct": False, "default_order": 4},
]


async def _create_topic(client, headers, name="Physics"):
    resp = await client.post("/api/topics", json={"name": name}, headers=headers)
    return resp.json()["id"]


async def test_create_question_with_five_alternatives(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics1")
    resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "What is gravity?",
        "alternatives": FIVE_ALTS,
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert len(resp.json()["alternatives"]) == 5
    assert resp.json()["status"] == "DRAFT"


async def test_reject_less_than_five_alternatives(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics2")
    resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "Bad question",
        "alternatives": FIVE_ALTS[:3],
    }, headers=auth_headers)
    assert resp.status_code == 400


async def test_reject_multiple_correct_alternatives(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics3")
    alts = [dict(a) for a in FIVE_ALTS]
    alts[1]["is_correct"] = True
    resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "Two correct",
        "alternatives": alts,
    }, headers=auth_headers)
    assert resp.status_code == 400


async def test_approve_question(client: AsyncClient, auth_headers: dict, admin_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics4")
    create_resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "Approvable question",
        "alternatives": FIVE_ALTS,
    }, headers=auth_headers)
    qid = create_resp.json()["id"]
    resp = await client.post(f"/api/questions/{qid}/approve", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "APPROVED"


async def test_reject_question(client: AsyncClient, auth_headers: dict, admin_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics5")
    create_resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "Rejectable question",
        "alternatives": FIVE_ALTS,
    }, headers=auth_headers)
    qid = create_resp.json()["id"]
    resp = await client.post(f"/api/questions/{qid}/reject", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"


async def test_approve_requires_admin(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Physics6")
    create_resp = await client.post("/api/questions", json={
        "topic_id": topic_id,
        "statement": "Teacher cannot approve",
        "alternatives": FIVE_ALTS,
    }, headers=auth_headers)
    qid = create_resp.json()["id"]
    resp = await client.post(f"/api/questions/{qid}/approve", headers=auth_headers)
    assert resp.status_code == 403
