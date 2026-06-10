# ExamForge — Backend

API REST para crear y gestionar exámenes virtuales con versiones aleatorizadas y exportación PDF.

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| Python | 3.11+ | Lenguaje base |
| FastAPI | 0.115+ | Framework web |
| SQLAlchemy 2.0 | async | ORM |
| Alembic | 1.18+ | Migraciones |
| SQLite + aiosqlite | dev | Base de datos desarrollo |
| PostgreSQL + asyncpg | prod | Base de datos producción |
| Pydantic v2 | 2.14+ | Validación y schemas |
| python-jose | 3.5+ | JWT |
| bcrypt | 5.0+ | Hash de contraseñas |
| Jinja2 | 3.1+ | Template LaTeX |
| Tectonic | externo | Compilador LaTeX → PDF |
| python-docx / pdfplumber | | Importación Word/PDF |
| Pillow | 12.2+ | Procesamiento de imágenes |
| pytest / pytest-asyncio | | Testing |

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, routers, lifespan
│   ├── config.py            # Settings con pydantic-settings
│   ├── database.py          # Engine async, Base, get_db()
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic v2 request/response schemas
│   ├── routers/             # Endpoints FastAPI
│   ├── services/            # Lógica de negocio
│   ├── templates/           # exam_template.tex.j2
│   └── utils/               # security, exceptions, file_names
├── migrations/              # Alembic migrations
├── tests/                   # pytest tests
├── uploads/                 # Imágenes subidas
├── pdfs/                    # PDFs generados
├── requirements.txt
├── .env.example
└── alembic.ini
```

## Modelos principales

### User
Autenticación con JWT. Campos: `id`, `full_name`, `email`, `hashed_password`, `is_active`, `created_at`.

### Topic → Question → Alternative
- `Topic` agrupa preguntas por materia.
- `Question` tiene enunciado (texto, LaTeX o imagen) e imagelink opcional.
- `Alternative` tiene exactamente 5 por pregunta; solo una tiene `is_correct=True`.

### Exam → ExamConfig + ExamTopic
- `Exam` es el encabezado (título, institución, docente, fecha).
- `ExamConfig` guarda `total_questions = total_topics × questions_per_topic` (validado al crear).
- `ExamTopic` asocia qué temas participan y cuántas preguntas aporta cada uno.

### ExamVersion → ExamVersionQuestion → ExamVersionAlternative
Snapshot completo del examen en un orden específico, incluyendo la letra correcta calculada post-aleatorización.

## Motor de aleatorización

1. Por cada versión solicitada, se asigna un código (`A`, `B`, `C`…).
2. El orden de los bloques de temas se mezcla aleatoriamente.
3. Dentro de cada bloque, las preguntas seleccionadas también se mezclan.
4. Las alternativas de cada pregunta se mezclan independientemente.
5. Se asignan letras `A–E` a las alternativas en el nuevo orden.
6. `is_correct_snapshot` se determina DESPUÉS del shuffle, buscando la alternativa original con `is_correct=True`.
7. Todo queda guardado en `ExamVersionAlternative` para reproducibilidad exacta.

**Invariante crítico:** el sistema nunca asume que la respuesta correcta tiene una letra fija. Siempre se recalcula después del shuffle.

## Flujo de generación PDF

1. `GET /api/versions/{id}/pdf` → `latex_service.generate_pdf(version_id, db)`.
2. Se cargan todos los datos de la versión (examen, preguntas, alternativas en orden).
3. Se renderiza `exam_template.tex.j2` con Jinja2 (delimitadores `((( )))` para evitar conflictos con LaTeX).
4. El `.tex` resultante se escribe en un directorio temporal.
5. Se ejecuta `tectonic <archivo>.tex` con `subprocess.run()`.
6. El PDF resultante se mueve a `PDF_OUTPUT_DIR` y se actualiza `pdf_path` en la BD.
7. Se devuelve el archivo como descarga con `FileResponse`.

Si Tectonic no está instalado, se devuelve un error HTTP 500 con mensaje descriptivo.

## Instalación

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

> **Nota Python 3.14:** pydantic-core requiere la versión pre-release `2.14.0a1`. Ya está incluida en `requirements.txt`. Si usas Python 3.11–3.13, puedes cambiar `pydantic==2.14.0a1` a `pydantic==2.11.x`.

## Configuración `.env`

Copia `.env.example` a `.env` y ajusta los valores:

```env
DATABASE_URL=sqlite+aiosqlite:///./examforge.db
SECRET_KEY=tu-clave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
TECTONIC_PATH=tectonic
PDF_OUTPUT_DIR=./pdfs
FRONTEND_URL=http://localhost:5173
```

Para **producción con PostgreSQL**:
```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/examforge
```

## Migraciones

```bash
# Crear nueva migración (después de cambiar modelos)
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head
```

## Ejecución

```bash
# Desarrollo
uvicorn app.main:app --reload

# Producción
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

Swagger disponible en: **http://localhost:8000/docs**

## Tests

```bash
pytest

# Con coverage
pytest --cov=app --cov-report=term-missing
```

Los tests usan una base de datos SQLite **en memoria** (`:memory:`), completamente aislada de la BD de desarrollo.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/refresh` | Renovar access token |
| GET/POST | `/api/topics` | Listar / Crear temas |
| GET/PUT/DELETE | `/api/topics/{id}` | Gestionar tema |
| GET/POST | `/api/questions` | Listar / Crear preguntas |
| POST | `/api/questions/import` | Importar desde Word/PDF |
| POST | `/api/questions/{id}/image` | Subir imagen a pregunta |
| POST | `/api/alternatives/{id}/image` | Subir imagen a alternativa |
| GET/POST | `/api/exams` | Listar / Crear exámenes |
| POST | `/api/exams/{id}/versions` | Generar versiones aleatorizadas |
| GET | `/api/exams/{id}/export-all` | Descargar ZIP con todos los PDFs |
| GET | `/api/versions/{id}/preview` | Preview de versión |
| GET | `/api/versions/{id}/answer-key` | Clave de respuestas |
| GET | `/api/versions/{id}/pdf` | Descargar PDF |

## Pendientes / Notas

- **Tectonic:** instalar desde https://tectonic-typesetting.github.io. En Docker, agregar al image build.
- **python-magic en Windows:** la detección MIME usa firmas de bytes propias (no python-magic) por compatibilidad cross-platform.
- **Autenticación en endpoints:** los endpoints GET no requieren JWT para facilitar consultas del frontend. Para entorno productivo, aplica `get_current_user` también en GETs.
- **Importación Word/PDF:** la detección es heurística. Formatos muy complejos pueden requerir ajuste en `import_service.py`.
