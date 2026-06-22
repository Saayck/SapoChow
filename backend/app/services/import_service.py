r"""
Import service for Word (.docx) and PDF files.

Detection heuristic:
- Paragraphs starting with a number followed by . or ) are treated as question stems.
- Lines starting with A) B) C) D) E) (or a) b)…) are treated as alternatives.
- The first alternative that contains a marker like *, (correct), or [correct] is flagged correct.
- LaTeX math delimiters \(...\), \[...\], $...$ and $$...$$ are detected. When the
  content is *entirely* one math expression, it is stored in the *_latex field
  (without delimiters). Otherwise the raw text — including delimiters — is kept
  in the *_text field and the frontend renders the math inline with KaTeX.
"""
import re
from pathlib import Path

from app.schemas.question import QuestionImportPreview, ImportedQuestionPreview, ImportedAlternativePreview
from app.utils.exceptions import ValidationError

QUESTION_RE = re.compile(r"^\s*(\d+)[\.\)]\s+(.+)$", re.DOTALL)
ALT_RE = re.compile(r"^\s*([a-eA-E])[\.\)]\s+(.+)$", re.DOTALL)
CORRECT_MARKERS = re.compile(r"\*|\(correct\)|\[correct\]|✓", re.IGNORECASE)

# Matches a single LaTeX math expression that occupies the entire string
PURE_LATEX_RE = re.compile(
    r"^\s*(?:"
    r"\\\((?P<inline>.+?)\\\)"        # \( ... \)
    r"|\\\[(?P<display>.+?)\\\]"       # \[ ... \]
    r"|\$\$(?P<displaydollar>.+?)\$\$" # $$ ... $$
    r"|\$(?P<inlinedollar>.+?)\$"      # $ ... $
    r")\s*$",
    re.DOTALL,
)


def _split_text_and_latex(content: str) -> tuple[str | None, str | None]:
    """Return (text, latex) for a content string.

    If the content is a single LaTeX expression, returns (None, latex_body).
    Otherwise returns (content, None) preserving any inline delimiters so the
    frontend can render the math via KaTeX.
    """
    if not content:
        return None, None
    stripped = content.strip()
    m = PURE_LATEX_RE.match(stripped)
    if m:
        body = m.group("inline") or m.group("display") or m.group("displaydollar") or m.group("inlinedollar")
        return None, body.strip()
    return stripped, None


def _parse_lines(lines: list[str]) -> list[ImportedQuestionPreview]:
    questions: list[ImportedQuestionPreview] = []
    current_q: ImportedQuestionPreview | None = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        q_match = QUESTION_RE.match(line)
        alt_match = ALT_RE.match(line)

        if q_match:
            if current_q:
                questions.append(current_q)
            stmt = q_match.group(2).strip()
            text, latex = _split_text_and_latex(stmt)
            current_q = ImportedQuestionPreview(
                statement_text=text,
                statement_latex=latex,
            )
        elif alt_match and current_q is not None:
            content = alt_match.group(2).strip()
            is_correct = bool(CORRECT_MARKERS.search(content))
            clean_content = CORRECT_MARKERS.sub("", content).strip()
            text, latex = _split_text_and_latex(clean_content)
            current_q.alternatives.append(
                ImportedAlternativePreview(
                    content_text=text,
                    content_latex=latex,
                    is_correct=is_correct,
                )
            )
        else:
            # Continuation of current question statement (no alternatives yet)
            if current_q and not current_q.alternatives:
                existing = current_q.statement_text or (
                    f"\\({current_q.statement_latex}\\)" if current_q.statement_latex else ""
                )
                merged = (existing + " " + line).strip()
                text, latex = _split_text_and_latex(merged)
                current_q.statement_text = text
                current_q.statement_latex = latex

    if current_q:
        questions.append(current_q)

    for q in questions:
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
