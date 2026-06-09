import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def _create_topic(client, headers, name="Chemistry"):
    resp = await client.post("/api/topics", json={"name": name}, headers=headers)
    return resp.json()["id"]


async def test_create_exam(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Chem1")
    resp = await client.post("/api/exams", json={
        "title": "Midterm Exam",
        "config": {
            "total_questions": 5,
            "total_topics": 1,
            "questions_per_topic": 5,
            "versions_count": 2,
            "shuffle_questions": True,
            "shuffle_alternatives": True,
        },
        "topics": [{"topic_id": topic_id, "questions_count": 5, "display_order": 1}],
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["title"] == "Midterm Exam"


async def test_create_exam_mismatched_total_questions(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Chem2")
    resp = await client.post("/api/exams", json={
        "title": "Bad Exam",
        "config": {
            "total_questions": 10,
            "total_topics": 1,
            "questions_per_topic": 5,
            "versions_count": 1,
            "shuffle_questions": True,
            "shuffle_alternatives": True,
        },
        "topics": [{"topic_id": topic_id, "questions_count": 5, "display_order": 1}],
    }, headers=auth_headers)
    assert resp.status_code == 400


async def test_create_exam_mismatched_total_topics(client: AsyncClient, auth_headers: dict):
    topic_id = await _create_topic(client, auth_headers, "Chem3")
    resp = await client.post("/api/exams", json={
        "title": "Bad Exam 2",
        "config": {
            "total_questions": 5,
            "total_topics": 2,
            "questions_per_topic": 5,
            "versions_count": 1,
            "shuffle_questions": True,
            "shuffle_alternatives": True,
        },
        "topics": [{"topic_id": topic_id, "questions_count": 5, "display_order": 1}],
    }, headers=auth_headers)
    assert resp.status_code == 400
