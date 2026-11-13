FROM python:3.11-slim

WORKDIR /app

COPY simulator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY simulator/ ./simulator/
COPY data/ ./data/

ENV PYTHONPATH=/app

CMD ["python", "simulator/app/main.py"]