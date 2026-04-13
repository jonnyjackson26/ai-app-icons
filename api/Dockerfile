FROM python:3.12-slim

WORKDIR /app

# Install the package with API extras
COPY . .
RUN pip install --no-cache-dir ".[api]"

# Expose the port fly.io expects
EXPOSE 8080

# Run the API server
CMD ["uvicorn", "ai_app_icons.api.main:app", "--host", "0.0.0.0", "--port", "8080"]