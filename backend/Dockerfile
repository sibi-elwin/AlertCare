WORKDIR /app

COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY train.py .
COPY predict.py .
COPY data/ ./data/
COPY system/ ./system/
COPY features/ ./features/
COPY scoring/ ./scoring/

