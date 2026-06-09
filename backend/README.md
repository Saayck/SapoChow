# SapoChow – Backend

Este es el servidor del sistema de exámenes SapoChow. Se encarga de toda la lógica: guardar preguntas, crear exámenes, generar versiones aleatorizadas y exportar PDFs. El frontend (interfaz visual) se conecta a este servidor a través de una API.

---

## ¿Qué hace este proyecto?

El sistema permite a los profesores:

1. **Crear un banco de preguntas** organizadas por temas. Cada pregunta tiene 5 alternativas y exactamente 1 correcta.
2. **Armar exámenes** seleccionando de qué temas sacar preguntas y cuántas.
3. **Generar versiones aleatorizadas** del mismo examen (Versión A, B, C...) donde el orden de las preguntas y alternativas cambia en cada versión.
4. **Exportar PDFs** listos para imprimir, con la clave de respuestas al final.
5. **Aprobar o rechazar preguntas** antes de que entren al banco (solo admins).

---

## Tecnologías usadas

| Tecnología | ¿Para qué? |
|---|---|
| **Python** | Lenguaje de programación del backend |
| **FastAPI** | Framework para crear la API (los endpoints que consume el frontend) |
| **PostgreSQL** | Base de datos donde se guarda todo |
| **SQLAlchemy** | Librería para hablar con la base de datos desde Python |
| **Alembic** | Herramienta para gestionar cambios en la estructura de la BD |
| **JWT** | Sistema de autenticación con tokens (login) |
| **ReportLab** | Generación de PDFs |

---

## Instalación (primera vez)

### Paso 1 — Instalar Python

Descargá Python 3.11 o superior desde **https://www.python.org/downloads/**

> Durante la instalación en Windows, **marcá la casilla "Add Python to PATH"** antes de hacer clic en Install. Si no lo hacés, los comandos de Python no van a funcionar en la terminal.

Para verificar que quedó bien:

```bash
python --version
# Debe mostrar algo como: Python 3.11.x
```

---

### Paso 2 — Instalar PostgreSQL

Descargá e instalá PostgreSQL desde **https://www.postgresql.org/download/**

Durante la instalación te va a pedir una contraseña para el usuario `postgres`. Guardala porque la vas a necesitar.

Una vez instalado, abrí **pgAdmin** (viene incluido) y creá una base de datos llamada `sapochow`.

---

### Paso 3 — Clonar el repositorio y entrar a la carpeta

```bash
git clone <url-del-repo>
cd SapoChow/backend
```

---

### Paso 4 — Crear el entorno virtual

El entorno virtual es una carpeta que guarda las dependencias del proyecto de forma aislada, sin mezclarlas con otras cosas instaladas en tu computadora. **Siempre hay que activarlo antes de trabajar.**

```bash
# Crear el entorno virtual
python -m venv venv

# Activarlo en Windows (PowerShell)
venv\Scripts\Activate.ps1

# Activarlo en Windows (CMD)
venv\Scripts\activate.bat

# Activarlo en Mac / Linux
source venv/bin/activate
```

Sabrás que está activo porque la terminal muestra `(venv)` al inicio de cada línea.

---

### Paso 5 — Instalar las dependencias

```bash
pip install -r requirements.txt
```

Esto descarga e instala todas las librerías que usa el proyecto (FastAPI, SQLAlchemy, etc.). Solo hay que hacerlo una vez, o cuando alguien agregue nuevas dependencias al archivo `requirements.txt`.

---

### Paso 6 — Configurar las variables de entorno

Las variables de entorno son configuraciones que cambian entre cada computadora (como la contraseña de la base de datos). No se suben a Git porque son privadas.

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Abrí el archivo `.env` que se creó y completá tus datos:

```
DATABASE_URL=postgresql+asyncpg://postgres:TU_PASSWORD@localhost:5432/sapochow
SECRET_KEY=cualquier-texto-largo-y-aleatorio
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=uploads
PDF_OUTPUT_DIR=pdfs
DB_ECHO=false
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

Reemplazá `TU_PASSWORD` con la contraseña que pusiste al instalar PostgreSQL.

---

### Paso 7 — Crear las tablas en la base de datos

Las migraciones son scripts que crean o modifican las tablas de la base de datos. Solo hay que correr este comando y Alembic se encarga de todo:

```bash
alembic upgrade head
```

---

### Paso 8 — Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

El flag `--reload` hace que el servidor se reinicie automáticamente cada vez que guardás un archivo. Ideal para desarrollo.

El servidor queda disponible en:

- **API:** http://localhost:8000
- **Documentación interactiva:** http://localhost:8000/docs

---

## Conectarse a FastAPI y empezar a desarrollar

Con el servidor corriendo, abrí **http://localhost:8000/docs** en el navegador. Vas a ver la interfaz de Swagger, que lista todos los endpoints disponibles y te permite probarlos sin necesitar Postman ni código.

**Para autenticarte en la interfaz:**

1. Expandí `POST /api/auth/register` → clic en **Try it out** → completá el body → **Execute**
2. Expandí `POST /api/auth/login` → **Try it out** → ingresá usuario y contraseña → **Execute**
3. Copiá el valor de `access_token` de la respuesta
4. Hacé clic en **Authorize** (arriba a la derecha de la página)
5. Pegá el token en el campo `Value` → **Authorize**

A partir de ahí, todos los endpoints que uses desde esa interfaz ya van autenticados.

**Para probar un endpoint:**

1. Expandilo haciendo clic
2. Clic en **Try it out**
3. Completá los campos que pide (el body en JSON, parámetros de URL, etc.)
4. Clic en **Execute**
5. Abajo aparece la respuesta con el código HTTP y el JSON devuelto

---

## Roles de usuario

El sistema maneja dos roles:

| Rol | Puede hacer |
|---|---|
| `teacher` | Crear temas, preguntas, exámenes, generar versiones, subir archivos |
| `admin` | Todo lo anterior + aprobar y rechazar preguntas |

Al registrarse, todos los usuarios quedan como `teacher` por defecto. Para darle rol de admin a alguien hay que hacerlo directamente en la base de datos, por pgAdmin o con este SQL:

```sql
UPDATE users SET role = 'admin' WHERE username = 'nombre_del_usuario';
```

---

## Estructura del proyecto

```
backend/
├── app/
│   ├── core/           # Configuración general y seguridad (tokens JWT)
│   ├── database/       # Conexión a la base de datos
│   ├── dependencies/   # Validaciones reutilizables (ej: verificar que el usuario esté logueado)
│   ├── models/         # Tablas de la base de datos definidas en Python
│   ├── repositories/   # Consultas a la base de datos (SELECT, INSERT, etc.)
│   ├── routers/        # Endpoints de la API (las rutas HTTP)
│   ├── schemas/        # Formato de los datos que entran y salen por la API
│   ├── services/       # Lógica de negocio (reglas del sistema)
│   ├── utils/          # Funciones de utilidad general
│   └── main.py         # Punto de entrada — acá arranca la app
├── migrations/         # Historial de cambios en la base de datos
├── tests/              # Tests automáticos
├── .env.example        # Plantilla de configuración
├── alembic.ini         # Configuración de Alembic
└── requirements.txt    # Lista de dependencias Python
```

### ¿Por dónde empezar si quiero cambiar algo?

- **Agregar un campo a la BD** → `models/` y luego crear una migración
- **Nueva consulta a la BD** → `repositories/`
- **Nueva regla de negocio** → `services/`
- **Nuevo endpoint** → `routers/`
- **Cambiar qué datos acepta o devuelve la API** → `schemas/`

---

## Flujo de una pregunta

Para que una pregunta pueda aparecer en un examen tiene que pasar por estos estados:

```
DRAFT → REVIEWED → APPROVED
                ↘ REJECTED
```

1. Un `teacher` crea la pregunta → queda en `DRAFT`
2. Un `admin` la revisa y la aprueba (`APPROVED`) o rechaza (`REJECTED`)
3. Solo las preguntas `APPROVED` pueden ser usadas al generar versiones de un examen

---

## Migraciones (cambios en la base de datos)

Cuando modificás un modelo en `models/`, tenés que crear una migración para que el cambio se aplique en la BD:

```bash
# Crear la migración (Alembic detecta los cambios automáticamente)
alembic revision --autogenerate -m "descripcion breve del cambio"

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Deshacer la última migración si algo salió mal
alembic downgrade -1
```

---

## Tests

Los tests verifican que la lógica del sistema funcione correctamente. Usan una base de datos SQLite temporal (no necesitás PostgreSQL corriendo para correrlos).

```bash
# Correr todos los tests
pytest tests/ -v

# Correr solo un archivo
pytest tests/test_auth.py -v

# Correr un test específico
pytest tests/test_questions.py::test_approve_question -v

# Ver cobertura de código
pytest tests/ -v --cov=app
```

---

## Problemas frecuentes

**`ModuleNotFoundError` al correr cualquier comando**
→ El entorno virtual no está activado. Activalo con `venv\Scripts\activate` (Windows).

**`connection refused` al correr migraciones o iniciar el servidor**
→ PostgreSQL no está corriendo, o la contraseña en `DATABASE_URL` del `.env` es incorrecta.

**`alembic: command not found`**
→ El entorno virtual no está activado.

**`403 Forbidden` al aprobar una pregunta**
→ Tu usuario tiene rol `teacher`. Necesitás un usuario con rol `admin`.

**El servidor arranca pero los cambios en el código no se reflejan**
→ Asegurate de haber iniciado con `--reload`. Si ya lo hiciste, guardá el archivo de nuevo.
