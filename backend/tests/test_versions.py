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


async def _setup_exam(client, headers, admin_headers):
    topic_resp = await client.post("/api/topics", json={"name": "Biology_v"}, headers=headers)
    topic_id = topic_resp.json()["id"]

    for i in range(5):
        q_resp = await client.post("/api/questions", json={
            "topic_id": topic_id,
            "statement": f"Bio question {i+1}",
            "alternatives": FIVE_ALTS,
        }, headers=headers)
        qid = q_resp.json()["id"]
        await client.post(f"/api/questions/{qid}/approve", headers=admin_headers)

    exam_resp = await client.post("/api/exams", json={
        "title": "Biology Exam",
        "config": {
            "total_questions": 5,
            "total_topics": 1,
            "questions_per_topic": 5,
            "versions_count": 2,
            "shuffle_questions": True,
            "shuffle_alternatives": True,
        },
        "topics": [{"topic_id": topic_id, "questions_count": 5, "display_order": 1}],
    }, headers=headers)
    return exam_resp.json()["id"]


async def test_generate_versions(client: AsyncClient, auth_headers: dict, admin_headers: dict):
    exam_id = await _setup_exam(client, auth_headers, admin_headers)
    resp = await client.post(f"/api/exams/{exam_id}/versions", json={}, headers=auth_headers)
    assert resp.status_code == 201
    assert len(resp.json()) == 2


async def test_answer_key_has_correct_structure(client: AsyncClient, auth_headers: dict, admin_headers: dict):
    exam_id = await _setup_exam(client, auth_headers, admin_headers)
    await client.post(f"/api/exams/{exam_id}/versions", json={}, headers=auth_headers)

    versions_resp = await client.get(f"/api/exams/{exam_id}/versions", headers=auth_headers)
    versions = versions_resp.json()
    assert len(versions) >= 2

    key_resp = await client.get(f"/api/versions/{versions[0]['id']}/answer-key", headers=auth_headers)
    assert key_resp.status_code == 200
    answer_key = key_resp.json()["answer_key"]
    assert len(answer_key) == 5
    for letter in answer_key.values():
        assert letter in ["A", "B", "C", "D", "E"]


async def test_two_versions_have_independent_answer_keys(client: AsyncClient, auth_headers: dict, admin_headers: dict):
    exam_id = await _setup_exam(client, auth_headers, admin_headers)
    await client.post(f"/api/exams/{exam_id}/versions", json={}, headers=auth_headers)

    versions_resp = await client.get(f"/api/exams/{exam_id}/versions", headers=auth_headers)
    versions = versions_resp.json()

    key1 = (await client.get(f"/api/versions/{versions[0]['id']}/answer-key", headers=auth_headers)).json()["answer_key"]
    key2 = (await client.get(f"/api/versions/{versions[1]['id']}/answer-key", headers=auth_headers)).json()["answer_key"]

    assert set(key1.keys()) == set(key2.keys())
