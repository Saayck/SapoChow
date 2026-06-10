"""
Import service for Word (.docx) and PDF files.

Detection heuristic:
- Paragraphs starting with a number followed by . or ) are treated as question stems.
- Lines starting with A) B) C) D) E) (or a) b)…) are treated as alternatives.
- The first alternative that contains a marker like *, (correct), or [correct] is flagged correct.
"""
import re
from pathlib import Path

from app.schemas.question import QuestionImportPreview, ImportedQuestionPreview, ImportedAlternativePreview
from app.utils.exceptions import ValidationError

QUESTION_RE = re.compile(r"^\s*(\d+)[\.\)]\s+(.+)$", re.DOTALL)
ALT_RE = re.compile(r"^\s*([a-eA-E])[\.\)]\s+(.+)$", re.DOTALL)
CORRECT_MARKERS = re.compile(r"\*|\(correct\)|\[correct\]|✓", re.IGNORECASE)


def _parse_lines(lines: list[str]) -> list[ImportedQuestionPreview]:
    questions: list[ImportedQuestionPreview] = []
    current_q: ImportedQuestionPreview | None = None
    warnings: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        q_match = QUESTION_RE.match(line)
        alt_match = ALT_RE.match(line)

        if q_match:
            if current_q:
                questions.append(current_q)
            current_q = ImportedQuestionPreview(statement_text=q_match.group(2).strip())
        elif alt_match and current_q is not None:
            content = alt_match.group(2).strip()
            is_correct = bool(CORRECT_MARKERS.search(content))
            clean_content = CORRECT_MARKERS.sub("", content).strip()
            current_q.alternatives.append(
                ImportedAlternativePreview(content_text=clean_content, is_correct=is_correct)
            )
        else:
            # Continuation of current question statement
            if current_q and not current_q.alternatives:
                current_q.statement_text = (current_q.statement_text or "") + " " + line

    if current_q:
        questions.append(current_q)

    # Post-process warnings per question
    for i, q in enumerate(questions, start=1):
        if len(q.alternatives) != 5:
            q.warnings.append(
                f"Expected 5 alternatives, found {len(q.alternatives)}"
            )
        correct_count = sum(1 for a in q.alternatives if a.is_correct)
        if correct_count == 0:
            q.warnings.append("No correct alternative detected — mark one with * or (correct)")
        elif correct_count > 1:
            q.warnings.append(f"Multiple correct alternatives detected ({correct_count})")

    return questions


def _import_docx(path: Path) -> list[ImportedQuestionPreview]:
    try:
        from docx import Document  # type: ignore
    except ImportError:
        raise ValidationError("python-docx is not installed")

    doc = Document(str(path))
    lines: list[str] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            lines.append(text)

    # Also read tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                text = cell.text.strip()
                if text:
                    lines.append(text)

    return _parse_lines(lines)


def _import_pdf(path: Path) -> list[ImportedQuestionPreview]:
    try:
        import pdfplumber  # type: ignore
    except ImportError:
        raise ValidationError("pdfplumber is not installed")

    lines: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                lines.extend(text.splitlines())

    return _parse_lines(lines)


async def import_questions_from_file(file_path: Path, file_name: str) -> QuestionImportPreview:
    ext = file_path.suffix.lower()
    global_warnings: list[str] = []

    if ext == ".docx":
        detected = _import_docx(file_path)
    elif ext == ".pdf":
        detected = _import_pdf(file_path)
    else:
        raise ValidationError(f"Unsupported file format '{ext}'. Use .docx or .pdf")

    if not detected:
        global_warnings.append("No questions detected. Check that the file uses the expected format.")

    return QuestionImportPreview(
        file_name=file_name,
        detected_questions=detected,
        warnings=global_warnings,
    )
