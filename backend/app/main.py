from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.routers import auth_router, topic_router, question_router, exam_router, version_router, import_router, file_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SapoChow API started")
    yield
    logger.info("SapoChow API shutting down")


app = FastAPI(
    title="SapoChow Exam System",
    description="API para gestión de exámenes virtuales: banco de preguntas, versiones aleatorizadas y exportación PDF.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(topic_router.router)
app.include_router(question_router.router)
app.include_router(exam_router.router)
app.include_router(version_router.router)
app.include_router(import_router.router)
app.include_router(file_router.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
