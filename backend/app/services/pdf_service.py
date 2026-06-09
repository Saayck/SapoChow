import uuid
import os
from pathlib import Path
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, PageBreak, HRFlowable,
)
from loguru import logger

from app.core.config import settings
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.exam_version import ExamVersion, GenerationStatus
from app.models.exam_version_question import ExamVersionQuestion
from app.models.exam_version_alternative import ExamVersionAlternative
from app.models.pdf_generation_log import PDFGenerationLog, PDFLogStatus


class PDFService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate(self, version_id: uuid.UUID) -> str:
        version = await self._load_full_version(version_id)
        if not version:
            raise NotFoundException("Version not found")
        if version.generation_status != GenerationStatus.COMPLETED:
            raise BadRequestException("Version is not completed yet")

        log = PDFGenerationLog(
            id=uuid.uuid4(),
            exam_version_id=version_id,
            status=PDFLogStatus.PENDING,
        )
        self.db.add(log)
        await self.db.flush()

        try:
            output_path = self._render_pdf(version)
            version.pdf_url = output_path
            log.status = PDFLogStatus.SUCCESS
            await self.db.commit()
            logger.info(f"PDF generated for version {version_id}: {output_path}")
            return output_path
        except Exception as exc:
            log.status = PDFLogStatus.FAILED
            log.error_message = str(exc)
            await self.db.commit()
            logger.error(f"PDF generation failed for version {version_id}: {exc}")
            raise

    def get_pdf_path(self, version_id: uuid.UUID) -> Optional[str]:
        path = Path(settings.PDF_OUTPUT_DIR) / f"{version_id}.pdf"
        return str(path) if path.exists() else None

    async def _load_full_version(self, version_id: uuid.UUID) -> Optional[ExamVersion]:
        result = await self.db.execute(
            select(ExamVersion)
            .where(ExamVersion.id == version_id)
            .options(
                selectinload(ExamVersion.exam),
                selectinload(ExamVersion.questions)
                .selectinload(ExamVersionQuestion.question),
                selectinload(ExamVersion.questions)
                .selectinload(ExamVersionQuestion.alternatives)
                .selectinload(ExamVersionAlternative.alternative),
            )
        )
        return result.scalar_one_or_none()

    def _render_pdf(self, version: ExamVersion) -> str:
        output_dir = Path(settings.PDF_OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / f"{version.id}.pdf")

        exam = version.exam

        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            leftMargin=2.5 * cm,
            rightMargin=2.5 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ExamTitle", parent=styles["Title"], fontSize=15, spaceAfter=6, alignment=1
        )
        subtitle_style = ParagraphStyle(
            "ExamSubtitle", parent=styles["Normal"], fontSize=12, spaceAfter=4, alignment=1
        )
        meta_style = ParagraphStyle(
            "ExamMeta", parent=styles["Normal"], fontSize=10, spaceAfter=3, leading=14
        )
        heading_style = ParagraphStyle(
            "ExamHeading", parent=styles["Heading2"], fontSize=11, spaceAfter=5
        )
        question_style = ParagraphStyle(
            "Question", parent=styles["Normal"], fontSize=10, spaceAfter=3, leading=14
        )
        alt_style = ParagraphStyle(
            "Alternative", parent=styles["Normal"], fontSize=10,
            spaceAfter=2, leading=13, leftIndent=18,
        )
        key_title_style = ParagraphStyle(
            "KeyTitle", parent=styles["Title"], fontSize=14, spaceAfter=8, alignment=1
        )

        elements = []

        # ── Header ────────────────────────────────────────────────────────────
        if exam.institution_name:
            elements.append(Paragraph(exam.institution_name, title_style))
        elements.append(Paragraph(exam.title, subtitle_style))
        elements.append(Spacer(1, 0.2 * cm))

        meta_rows = []
        if exam.course_name:
            meta_rows.append(f"<b>Curso:</b> {exam.course_name}")
        if exam.professor_name:
            meta_rows.append(f"<b>Profesor:</b> {exam.professor_name}")
        if exam.duration_minutes:
            meta_rows.append(f"<b>Duración:</b> {exam.duration_minutes} min")
        meta_rows.append(f"<b>Versión:</b> {version.version_label}")

        for row in meta_rows:
            elements.append(Paragraph(row, meta_style))

        elements.append(Spacer(1, 0.2 * cm))
        elements.append(
            Paragraph(
                "Nombre: ________________________________________________   "
                "Fecha: ____________________",
                meta_style,
            )
        )
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
        elements.append(Spacer(1, 0.3 * cm))

        if exam.instructions:
            elements.append(Paragraph("<b>Instrucciones:</b>", heading_style))
            elements.append(Paragraph(exam.instructions, meta_style))
            elements.append(Spacer(1, 0.3 * cm))

        # ── Questions ─────────────────────────────────────────────────────────
        elements.append(Paragraph("<b>PREGUNTAS</b>", heading_style))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
        elements.append(Spacer(1, 0.25 * cm))

        sorted_questions = sorted(version.questions, key=lambda q: q.position)
        current_block = 0

        for evq in sorted_questions:
            if evq.topic_block != current_block:
                current_block = evq.topic_block
                if current_block > 1:
                    elements.append(Spacer(1, 0.4 * cm))

            statement = evq.question.statement.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            elements.append(Paragraph(f"<b>{evq.position}.</b> {statement}", question_style))

            for eva in sorted(evq.alternatives, key=lambda a: a.position):
                content = eva.alternative.content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                elements.append(Paragraph(f"{eva.assigned_letter}) {content}", alt_style))

            elements.append(Spacer(1, 0.25 * cm))

        # ── Answer key ────────────────────────────────────────────────────────
        elements.append(PageBreak())
        elements.append(
            Paragraph(f"CLAVE DE RESPUESTAS — {version.version_label}", key_title_style)
        )
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
        elements.append(Spacer(1, 0.5 * cm))

        if version.answer_key:
            table_data = [["Pregunta", "Respuesta"]]
            for pos_str, letter in sorted(version.answer_key.items(), key=lambda x: int(x[0])):
                table_data.append([pos_str, letter])

            tbl = Table(table_data, colWidths=[3.5 * cm, 3.5 * cm])
            tbl.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4a90d9")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4ff")]),
                    ]
                )
            )
            elements.append(tbl)

        doc.build(elements)
        return output_path
