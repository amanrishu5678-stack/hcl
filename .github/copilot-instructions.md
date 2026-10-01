# Copilot instructions for INDUSENSE

This repository is a local Windows-friendly Embedded IoT + AI demo. Do not introduce Docker as a prerequisite for the default workflow.

## Architecture
- React/Vite frontend in `frontend/`
- FastAPI backend in `backend/app/`
- SQLite by default in `data/indusense.db`
- Python simulator in `simulator/`
- HTTP telemetry is the default local transport
- MQTT is optional; only use it when explicitly requested
- AI uses the saved Isolation Forest model in `backend/app/ml_models/`

## Rules
1. Preserve the existing professional industrial dashboard design.
2. Keep the backend API contract stable.
3. Do not hard-code telemetry values in React when API data exists.
4. Do not replace the ML detector with random values.
5. Put score/alert calculations in backend Python, not frontend code.
6. Use SQLite for local development unless PostgreSQL is explicitly requested.
7. Keep all local setup runnable in VS Code with Python + Node only.
8. Before claiming a feature works, run its relevant test or endpoint.
9. Prefer small focused changes and explain any schema/API changes.
10. Keep simulator modes: normal, vibration_anomaly, overheating, current_anomaly, critical, offline.
