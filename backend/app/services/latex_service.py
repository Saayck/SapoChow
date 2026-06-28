"""
LaTeX PDF generation service using Tectonic as compiler.

Flow:
1. Load full version data (exam + questions + alternatives).
2. Render the Jinja2 template to a .tex string.
3. Write the .tex to a temp directory.
4. Run Tectonic subprocess.
5. Move resulting PDF to PDF_OUTPUT_DIR.
6. Update ExamVersion.pdf_path.
7. Return the PDF path for streaming.
"""
import re
import subprocess
import tempfile
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.exam_version import ExamVersion
from app.schemas.version import VersionPreviewResponse
from app.utils.exceptions import NotFoundError, ServiceError


def _get_jinja_env() -> Environment:
    templates_dir = Path(__file__).parent.parent / "templates"
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=False,
        block_start_string="((*",
        block_end_string="*))",
        variable_start_string="(((",
        variable_end_string=")))",
        comment_start_string="((#",
        comment_end_string="#))",
    )
    return env


async def _load_version(version_id: int, db: AsyncSession) -> ExamVersion:
    result = await db.execute(
        select(ExamVersion)
        .where(ExamVersion.id == version_id)
        .options(
            selectinload(ExamVersion.exam),
            selectinload(ExamVersion.version_questions).selectinload(
                ExamVersion.version_questions.property.mapper.class_.question
            ),
            selectinload(ExamVersion.version_questions).selectinload(
                ExamVersion.version_questions.property.mapper.class_.version_alternatives
            ).selectinload(
                ExamVersion.version_questions.property.mapper.class_.version_alternatives.property.mapper.class_.alternative
            ),
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundError("ExamVersion", version_id)
    return version


_MATH_SEGMENT_RE = re.compile(
    r"\\\(.+?\\\)|\\\[.+?\\\]|\$\$.+?\$\$|\$[^$\n]+?\$",
    re.DOTALL,
)


def _escape_plain(text: str) -> str:
    replacements = [
        ("\\", r"\textbackslash{}"),
        ("&", r"\&"),
        ("%", r"\%"),
        ("$", r"\$"),
        ("#", r"\#"),
        ("_", r"\_"),
        ("{", r"\{"),
        ("}", r"\}"),
        ("~", r"\textasciitilde{}"),
        ("^", r"\textasciicircum{}"),
    ]
    for char, replacement in replacements:
        text = text.replace(char, replacement)
    return text


def _resolve_image_path(image_path: str | None) -> str | None:
    """Convert a DB-relative image path to an absolute path for LaTeX/Tectonic."""
    if not image_path:
        return None
    base_dir = Path(settings.UPLOAD_DIR).parent.resolve()
    abs_path = (base_dir / image_path).resolve()
    if not abs_path.exists():
        return None
    return str(abs_path).replace("\\", "/")


def _escape_latex(text: str | None) -> str:
    """Escape *text* for LaTeX, preserving any embedded math delimiters.

    Segments delimited by \\(...\\), \\[...\\], $...$ or $$...$$ are kept
    verbatim so Tectonic renders them as math. Everything else is escaped.
    """
    if not text:
        return ""

    out: list[str] = []
    last = 0
    for m in _MATH_SEGMENT_RE.finditer(text):
        if m.start() > last:
            out.append(_escape_plain(text[last:m.start()]))
        out.append(m.group(0))
        last = m.end()
    if last < len(text):
        out.append(_escape_plain(text[last:]))
    return "".join(out)


async def generate_pdf(version_id: int, db: AsyncSession) -> Path:
    from sqlalchemy.orm import selectinload
    from app.models.exam_version_question import ExamVersionQuestion
    from app.models.exam_version_alternative import ExamVersionAlternative
    from app.models.question import Question
    from app.models.alternative import Alternative

    result = await db.execute(
        select(ExamVersion)
        .where(ExamVersion.id == version_id)
        .options(selectinload(ExamVersion.exam))
    )
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundError("ExamVersion", version_id)

    vq_result = await db.execute(
        select(ExamVersionQuestion)
        .where(ExamVersionQuestion.exam_version_id == version_id)
        .options(
            selectinload(ExamVersionQuestion.question),
            selectinload(ExamVersionQuestion.version_alternatives).selectinload(
                ExamVersionAlternative.alternative
            )
        )
        .order_by(ExamVersionQuestion.order_number)
    )
    vqs = vq_result.scalars().all()

    questions_data = []
    answer_key = []
    for vq in vqs:
        alts_data = []
        correct_letter = "?"
        for va in sorted(vq.version_alternatives, key=lambda x: x.order_number):
            alt = va.alternative
            alts_data.append({
                "letter": va.letter,
                "content_text": _escape_latex(alt.content_text) if not alt.content_latex else None,
                "content_latex": alt.content_latex,
                "image_path": _resolve_image_path(alt.image_path),
                "is_correct": va.is_correct_snapshot,
            })
            if va.is_correct_snapshot:
                correct_letter = va.letter

        q = vq.question
        questions_data.append({
            "number": vq.order_number,
            "statement_text": _escape_latex(q.statement_text) if not q.statement_latex else None,
            "statement_latex": q.statement_latex,
            "image_path": _resolve_image_path(q.image_path),
            "alternatives": alts_data,
        })
        answer_key.append({"number": vq.order_number, "letter": correct_letter})

    exam = version.exam
    context = {
        "institution_name": _escape_latex(exam.institution_name),
        "title": _escape_latex(exam.title),
        "teacher_name": _escape_latex(exam.teacher_name),
        "exam_date": str(exam.exam_date),
        "exam_year": str(exam.exam_date.year),
        "modality": _escape_latex((exam.modality or "ORDINARIO").upper()),
        "version_code": version.version_code,
        "instructions": _escape_latex(exam.instructions or ""),
        "questions": questions_data,
        "answer_key": answer_key,
    }

    env = _get_jinja_env()
    try:
        template = env.get_template("exam_template.tex.j2")
        tex_content = template.render(**context)
    except Exception as e:
        raise ServiceError(f"Template rendering failed: {e}")

    with tempfile.TemporaryDirectory() as tmpdir:
        tex_file = Path(tmpdir) / f"exam_version_{version_id}.tex"
        tex_file.write_text(tex_content, encoding="utf-8")

        try:
            result = subprocess.run(
                [settings.TECTONIC_PATH, str(tex_file)],
                capture_output=True,
                text=True,
                cwd=tmpdir,
                timeout=120,
            )
        except FileNotFoundError:
            raise ServiceError(
                f"Tectonic not found at '{settings.TECTONIC_PATH}'. "
                "Install Tectonic or set TECTONIC_PATH in your .env"
            )
        except subprocess.TimeoutExpired:
            raise ServiceError("PDF compilation timed out")

        if result.returncode != 0:
            stderr_excerpt = result.stderr[-500:] if result.stderr else "(no stderr)"
            raise ServiceError(f"Tectonic compilation failed: {stderr_excerpt}")

        pdf_src = Path(tmpdir) / f"exam_version_{version_id}.pdf"
        if not pdf_src.exists():
            raise ServiceError("Tectonic ran but no PDF was produced")

        output_dir = Path(settings.PDF_OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)
        pdf_dest = output_dir / f"exam_{exam.id}_version_{version.version_code}.pdf"
        shutil.copy2(pdf_src, pdf_dest)

    # Update pdf_path in DB
    version.pdf_path = str(pdf_dest)
    await db.flush()

    return pdf_dest
