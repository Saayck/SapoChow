import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(scope="function", autouse=False)
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session):
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client):
    await client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def topic(client, auth_headers):
    resp = await client.post("/api/topics", json={"name": "Matemáticas", "description": "Álgebra básica"}, headers=auth_headers)
    return resp.json()


@pytest_asyncio.fixture
async def question_with_5_alts(client, auth_headers, topic):
    """Creates a valid question with 5 alternatives (one correct)."""
    payload = {
        "topic_id": topic["id"],
        "statement_text": "¿Cuánto es 2+2?",
        "alternatives": [
            {"content_text": "1", "is_correct": False},
            {"content_text": "2", "is_correct": False},
            {"content_text": "3", "is_correct": False},
            {"content_text": "4", "is_correct": True},
            {"content_text": "5", "is_correct": False},
        ],
    }
    resp = await client.post("/api/questions", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()
