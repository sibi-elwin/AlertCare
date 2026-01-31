FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install ML dependencies
COPY ml/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy ML source code (NOT models)
COPY ml/data/ ./data/
COPY ml/features/ ./features/
COPY ml/detectors/ ./detectors/
COPY ml/scoring/ ./scoring/
COPY ml/system/ ./system/
COPY ml/train.py .
COPY ml/predict.py .

# Persistent directories (no source code here)
RUN mkdir -p /app/output /app/models

CMD ["tail", "-f", "/dev/null"]
