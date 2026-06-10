import pytest


async def _create_topic_with_questions(client, auth_headers, n_questions: int, topic_name: str = "Tema"):
    """Creates a topic with n valid questions (5 alts, 1 correct)."""
    t_resp = await client.post("/api/topics", json={"name": topic_name}, headers=auth_headers)
    topic = t_resp.json()

    for i in range(n_questions):
        alts = [{"content_text": f"Alt {j} Q{i}", "is_correct": j == 0} for j in range(5)]
        await client.post("/api/questions", json={
            "topic_id": topic["id"],
            "statement_text": f"Pregunta {i} de {topic_name}",
            "alternatives": alts,
        }, headers=auth_headers)

    return topic


def _exam_payload(topic_id: int, total_q=5, total_topics=1, q_per_topic=5, versions=2):
    return {
        "title": "Examen de Prueba",
        "institution_name": "Instituto Test",
        "teacher_name": "Prof. Test",
        "exam_date": "2026-07-01",
        "instructions": "Lea con cuidado.",
        "config": {
            "total_questions": total_q,
            "total_topics": total_topics,
            "questions_per_topic": q_per_topic,
            "version_count": versions,
        },
        "topics": [{"topic_id": topic_id, "questions_count": q_per_topic}],
    }


@pytest.mark.asyncio
async def test_create_exam_valid(client, auth_headers):
    topic = await _create_topic_with_questions(client, auth_headers, 5, "Álgebra")
    resp = await client.post("/api/exams", json=_exam_payload(topic["id"]), headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Examen de Prueba"
    assert data["config"]["total_questions"] == 5


@pytest.mark.asyncio
async def test_reject_exam_wrong_total(client, auth_headers):
    topic = await _create_topic_with_questions(client, auth_headers, 5, "Geometría")
    # total_questions (10) != total_topics (1) * questions_per_topic (5)
    payload = _exam_payload(topic["id"])
    payload["config"]["total_questions"] = 10
    resp = await client.post("/api/exams", json=payload, headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_reject_exam_not_enough_questions(client, auth_headers):
    # Only 2 questions but exam requires 5
    topic = await _create_topic_with_questions(client, auth_headers, 2, "Trigonometría")
    resp = await client.post("/api/exams", json=_exam_payload(topic["id"]), headers=auth_headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_exams(client, auth_headers):
    topic = await _create_topic_with_questions(client, auth_headers, 5, "Estadística")
    await client.post("/api/exams", json=_exam_payload(topic["id"]), headers=auth_headers)
    resp = await client.get("/api/exams")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_exam(client, auth_headers):
    topic = await _create_topic_with_questions(client, auth_headers, 5, "Cálculo")
    create_resp = await client.post("/api/exams", json=_exam_payload(topic["id"]), headers=auth_headers)
    exam_id = create_resp.json()["id"]
    resp = await client.get(f"/api/exams/{exam_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == exam_id


@pytest.mark.asyncio
async def test_delete_exam(client, auth_headers):
    topic = await _create_topic_with_questions(client, auth_headers, 5, "Física II")
    create_resp = await client.post("/api/exams", json=_exam_payload(topic["id"]), headers=auth_headers)
    exam_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/exams/{exam_id}", headers=auth_headers)
    assert del_resp.status_code == 204
