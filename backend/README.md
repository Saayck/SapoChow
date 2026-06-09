# SapoChow – Backend de Sistema de Exámenes Virtuales

API REST construida con FastAPI para gestionar banco de preguntas, exámenes, versiones aleatorizadas y exportación de PDFs.

## Stack

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy async + asyncpg + PostgreSQL
- Alembic (migraciones)
- JWT auth con python-jose + passlib[bcrypt]
- Loguru (logging)

---

## Instalación

### 1. Crear y activar entorno virtual

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
copy .env.example .env      # Windows
cp .env.example .env        # Mac/Linux
```

Edita `.env` con tus credenciales de PostgreSQL y una `SECRET_KEY` fuerte.

---

## Migraciones

```bash
alembic upgrade head
```

---

## Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

- Documentación interactiva: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Ejecutar tests

Instala el driver SQLite para tests:

```bash
pip install aiosqlite
```

Luego corre:

```bash
pytest tests/ -v --cov=app
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Login, obtener tokens |
| POST | /api/auth/refresh | Renovar access token |
| GET/POST | /api/topics | Listar / crear temas |
| GET/POST | /api/questions | Listar / crear preguntas |
| POST | /api/questions/{id}/approve | Aprobar pregunta |
| POST | /api/questions/{id}/reject | Rechazar pregunta |
| GET/POST | /api/exams | Listar / crear exámenes |
| POST | /api/exams/{id}/versions | Generar versiones aleatorizadas |
| GET | /api/exams/{id}/versions | Listar versiones de un examen |
| GET | /api/versions/{id} | Obtener una versión |
| GET | /api/versions/{id}/answer-key | Obtener clave de respuestas |
| POST | /api/files/upload | Subir archivo |
| GET | /api/files/{id} | Obtener metadata de archivo |
| POST | /api/import/questions | Importar preguntas desde archivo |
| GET | /api/import/jobs | Listar jobs de importación |
