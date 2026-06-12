FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install tectonic (pinned version for reproducible builds)
RUN set -eux; \
    TECTONIC_VERSION="0.15.0"; \
    curl -fsSL \
        "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz" \
        | tar xz -C /usr/local/bin/; \
    tectonic --version

COPY requirements.txt .

# win32_setctime is Windows-only, remove it for Linux
RUN grep -v "win32_setctime" requirements.txt > /tmp/req.txt \
    && pip install --no-cache-dir -r /tmp/req.txt

COPY . .

RUN mkdir -p /app/uploads /app/pdfs /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
