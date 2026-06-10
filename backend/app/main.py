from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings
from app.database import create_tables
from app.routers import auth, topics, questions, alternatives, exams, versions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.PDF_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    await create_tables()
    logger.info("ExamForge backend started")
    yield
    # Shutdown
    logger.info("ExamForge backend stopped")


app = FastAPI(
    title="ExamForge API",
    description="API para crear y gestionar exámenes virtuales con versiones aleatorizadas.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads as static files
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(alternatives.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(versions.router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ExamForge API", "version": "1.0.0"}
