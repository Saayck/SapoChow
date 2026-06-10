import pytest


def _base_payload(topic_id: int, alts: list[dict] | None = None) -> dict:
    if alts is None:
        alts = [
            {"content_text": f"Opción {i}", "is_correct": i == 0}
            for i in range(5)
        ]
    return {
        "topic_id": topic_id,
        "statement_text": "Pregunta de prueba",
        "alternatives": alts,
    }


@pytest.mark.asyncio
async def test_create_question_5_alts(client, auth_headers, topic):
    resp = await client.post("/api/questions", json=_base_payload(topic["id"]), headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["alternatives"]) == 5
    assert sum(1 for a in data["alternatives"] if a["is_correct"]) == 1


@pytest.mark.asyncio
async def test_reject_4_alternatives(client, auth_headers, topic):
    alts = [{"content_text": f"Op {i}", "is_correct": i == 0} for i in range(4)]
    resp = await client.post("/api/questions", json=_base_payload(topic["id"], alts), headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_reject_6_alternatives(client, auth_headers, topic):
    alts = [{"content_text": f"Op {i}", "is_correct": i == 0} for i in range(6)]
    resp = await client.post("/api/questions", json=_base_payload(topic["id"], alts), headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_reject_no_correct_alternative(client, auth_headers, topic):
    alts = [{"content_text": f"Op {i}", "is_correct": False} for i in range(5)]
    resp = await client.post("/api/questions", json=_base_payload(topic["id"], alts), headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_reject_multiple_correct_alternatives(client, auth_headers, topic):
    alts = [{"content_text": f"Op {i}", "is_correct": i < 2} for i in range(5)]
    resp = await client.post("/api/questions", json=_base_payload(topic["id"], alts), headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_question(client, auth_headers, question_with_5_alts):
    qid = question_with_5_alts["id"]
    resp = await client.get(f"/api/questions/{qid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == qid


@pytest.mark.asyncio
async def test_list_questions_filter_by_topic(client, auth_headers, topic, question_with_5_alts):
    resp = await client.get(f"/api/questions?topic_id={topic['id']}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_update_question(client, auth_headers, question_with_5_alts):
    qid = question_with_5_alts["id"]
    new_alts = [{"content_text": f"Nueva {i}", "is_correct": i == 2} for i in range(5)]
    resp = await client.put(f"/api/questions/{qid}", json={"alternatives": new_alts}, headers=auth_headers)
    assert resp.status_code == 200
    updated = resp.json()
    assert sum(1 for a in updated["alternatives"] if a["is_correct"]) == 1


@pytest.mark.asyncio
async def test_delete_question(client, auth_headers, topic):
    payload = _base_payload(topic["id"])
    create_resp = await client.post("/api/questions", json=payload, headers=auth_headers)
    qid = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/questions/{qid}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = await client.get(f"/api/questions/{qid}")
    assert get_resp.status_code == 404
