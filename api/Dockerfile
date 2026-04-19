FROM python:3.12-slim

WORKDIR /app

# Install the package with API + telemetry extras
# (Sentry SDK is only activated at runtime when SENTRY_DSN is set.)
COPY . .
RUN pip install --no-cache-dir ".[api,telemetry]"

# Expose the port fly.io expects
EXPOSE 8080

# Run the API server
CMD ["uvicorn", "ai_app_icons.api.main:app", "--host", "0.0.0.0", "--port", "8080"]