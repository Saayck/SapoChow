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

# Pre-warm Tectonic: descarga todos los paquetes LaTeX en build time
RUN printf '\
\\documentclass[10pt,a4paper]{article}\n\
\\usepackage[utf8]{inputenc}\n\
\\usepackage[T1]{fontenc}\n\
\\usepackage[spanish]{babel}\n\
\\usepackage[top=2cm,bottom=2.5cm,left=1.8cm,right=1.8cm]{geometry}\n\
\\usepackage{amsmath,amssymb,amsfonts}\n\
\\usepackage{graphicx}\n\
\\usepackage{enumitem}\n\
\\usepackage{fancyhdr}\n\
\\usepackage{lastpage}\n\
\\usepackage{multicol}\n\
\\usepackage{microtype}\n\
\\usepackage{tabularx}\n\
\\pagestyle{fancy}\n\
\\fancyhf{}\n\
\\fancyhead[L]{\\small\\textbf{ORDINARIO}}\n\
\\fancyhead[R]{\\small\\textbf{TEMA ``A''}}\n\
\\fancyfoot[R]{\\small Page: \\thepage}\n\
\\renewcommand{\\headrulewidth}{0pt}\n\
\\renewcommand{\\footrulewidth}{0pt}\n\
\\setlist[enumerate,1]{leftmargin=1.5em,label=\\textbf{\\arabic*)},itemsep=5pt,parsep=0pt,topsep=0pt}\n\
\\setlist[enumerate,2]{leftmargin=0.3cm,label={},itemsep=1pt,parsep=0pt,topsep=2pt}\n\
\\begin{document}\n\
\\thispagestyle{empty}\n\
\\null\\vspace{2cm}\n\
\\begin{center}\n\
  {\\large\\bfseries Universidad}\\\\[2cm]\n\
  {\\LARGE\\bfseries Examen 2024}\\\\[2.5cm]\n\
  {\\LARGE\\bfseries MODALIDAD}\\\\[6pt]\n\
  {\\LARGE\\bfseries ORDINARIO}\\\\[2.5cm]\n\
  \\LARGE\\bfseries TEMA:\\enspace\n\
  {\\setlength{\\fboxrule}{2.5pt}\\setlength{\\fboxsep}{10pt}\\fbox{\\huge\\bfseries A}}\\\\[3cm]\n\
  {\\small\\bfseries Docente: Docente \\quad|\\quad Fecha: 2024-01-01}\n\
\\end{center}\n\
\\newpage\n\
\\begin{multicols}{2}\n\
\\begin{enumerate}\n\
\\item Pregunta de prueba\n\
\\begin{enumerate}\n\
\\item[A)] Alternativa A\n\
\\item[B)] Alternativa B\n\
\\item[C)] Alternativa C\n\
\\item[D)] Alternativa D\n\
\\item[E)] Alternativa E\n\
\\end{enumerate}\n\
\\end{enumerate}\n\
\\end{multicols}\n\
\\end{document}\n\
' > /tmp/warmup.tex \
    && tectonic /tmp/warmup.tex \
    && rm -f /tmp/warmup.tex /tmp/warmup.pdf

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
