"""
Tests for version generation, preview, answer key, PDF (mocked), and ZIP export.
"""
import io
import json
import tempfile
import zipfile
from unittest.mock import patch, MagicMock
from pathlib import Path

import pytest


async def _create_exam_with_questions(client, auth_headers, n_q=5):
    """Helper: topic + n_q questions + exam."""
    t_resp = await client.post("/api/topics", json={"name": "Temario Test"}, headers=auth_headers)
    topic = t_resp.json()

    for i in range(n_q):
        alts = [{"content_text": f"Alt {j}", "is_correct": j == 0} for j in range(5)]
        await client.post("/api/questions", json={
            "topic_id": topic["id"],
            "statement_text": f"Pregunta {i}",
            "alternatives": alts,
        }, headers=auth_headers)

    exam_resp = await client.post("/api/exams", json={
        "title": "Examen Versiones",
        "institution_name": "Instituto",
        "teacher_name": "Docente",
        "exam_date": "2026-08-01",
        "config": {
            "total_questions": n_q,
            "total_topics": 1,
            "questions_per_topic": n_q,
            "version_count": 3,
        },
        "topics": [{"topic_id": topic["id"], "questions_count": n_q}],
    }, headers=auth_headers)
    assert exam_resp.status_code == 201, exam_resp.text
    return exam_resp.json()


@pytest.mark.asyncio
async def test_generate_versions(client, auth_headers):
    exam = await _create_exam_with_questions(client, auth_headers)
    resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["exam_id"] == exam["id"]
    assert len(data["generated_versions"]) == 3
    codes = [v["version_code"] for v in data["generated_versions"]]
    assert codes == ["A", "B", "C"]


@pytest.mark.asyncio
async def test_versions_have_questions(client, auth_headers):
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    version_id = gen_resp.json()["generated_versions"][0]["id"]

    prev_resp = await client.get(f"/api/versions/{version_id}/preview")
    assert prev_resp.status_code == 200
    data = prev_resp.json()
    assert len(data["questions"]) == 5


@pytest.mark.asyncio
async def test_versions_each_question_has_5_alts(client, auth_headers):
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    version_id = gen_resp.json()["generated_versions"][0]["id"]

    prev_resp = await client.get(f"/api/versions/{version_id}/preview")
    for q in prev_resp.json()["questions"]:
        assert len(q["alternatives"]) == 5


@pytest.mark.asyncio
async def test_correct_answer_recalculated_after_shuffle(client, auth_headers):
    """Each version may have the correct answer on a different letter — but always exactly one correct per question."""
    exam = await _create_exam_with_questions(client, auth_headers, n_q=5)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={"seed": 42}, headers=auth_headers)
    versions = gen_resp.json()["generated_versions"]

    for v in versions:
        prev = await client.get(f"/api/versions/{v['id']}/preview")
        for q in prev.json()["questions"]:
            correct_count = sum(1 for a in q["alternatives"] if a["is_correct"])
            assert correct_count == 1, f"Expected 1 correct alt, got {correct_count}"


@pytest.mark.asyncio
async def test_get_answer_key(client, auth_headers):
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    version_id = gen_resp.json()["generated_versions"][0]["id"]

    key_resp = await client.get(f"/api/versions/{version_id}/answer-key")
    assert key_resp.status_code == 200
    data = key_resp.json()
    assert "version_code" in data
    assert len(data["answers"]) == 5
    for item in data["answers"]:
        assert item["correct_letter"] in list("ABCDE")


@pytest.mark.asyncio
async def test_get_preview(client, auth_headers):
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    version_id = gen_resp.json()["generated_versions"][0]["id"]

    prev_resp = await client.get(f"/api/versions/{version_id}/preview")
    assert prev_resp.status_code == 200
    data = prev_resp.json()
    assert data["version_id"] == version_id
    assert "exam" in data
    assert "questions" in data


@pytest.mark.asyncio
async def test_pdf_generation_mocked(client, auth_headers):
    """Mock Tectonic to test PDF endpoint without requiring the binary."""
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    version_id = gen_resp.json()["generated_versions"][0]["id"]

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(b"%PDF-1.4 fake content")
        fake_pdf = Path(tmp.name)

    try:
        with patch("app.routers.versions.generate_pdf") as mock_gen_pdf:
            mock_gen_pdf.return_value = fake_pdf
            resp = await client.get(f"/api/versions/{version_id}/pdf")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
    finally:
        fake_pdf.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_export_zip(client, auth_headers):
    """Test ZIP export with mocked PDF generation."""
    exam = await _create_exam_with_questions(client, auth_headers)
    gen_resp = await client.post(f"/api/exams/{exam['id']}/versions", json={}, headers=auth_headers)
    exam_id = exam["id"]
    versions = gen_resp.json()["generated_versions"]

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(b"%PDF-1.4 fake")
        fake_pdf = Path(tmp.name)

    try:
        with patch("app.routers.versions.generate_pdf") as mock_gen_pdf:
            mock_gen_pdf.return_value = fake_pdf
            resp = await client.get(f"/api/exams/{exam_id}/export-all")
    finally:
        fake_pdf.unlink(missing_ok=True)

    assert resp.status_code == 200
    assert "zip" in resp.headers["content-type"]

    zdata = io.BytesIO(resp.content)
    with zipfile.ZipFile(zdata) as zf:
        names = zf.namelist()
        for v in versions:
            key_file = f"version_{v['version_code']}_answer_key.json"
            assert key_file in names
            key_data = json.loads(zf.read(key_file))
            assert key_data["version_code"] == v["version_code"]
            assert len(key_data["answers"]) == 5
