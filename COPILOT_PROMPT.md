# Copilot prompt for this project

Paste this into Copilot Chat after opening the repository:

```text
You are helping me develop the INDUSENSE AI Industrial Equipment Health Scoring project.

Keep the default workflow Windows-friendly and Docker-free:
- FastAPI backend
- SQLite database
- React/Vite frontend
- HTTP telemetry from the simulator
- WebSocket live dashboard updates
- Isolation Forest anomaly detector with deterministic fallback

Do not introduce PostgreSQL, Mosquitto, Docker, cloud services, or external APIs unless I explicitly ask for them.

Before changing code:
1. Inspect the existing implementation.
2. Preserve the API contract.
3. Preserve the professional industrial dashboard.
4. Keep the health score and alert calculations on the backend.
5. Do not replace ML inference with random values.
6. Run tests or endpoint checks after each significant change.
7. Explain any database/schema/API change.

When I ask you to add a feature, implement it in the correct layer and update tests/docs where appropriate.
```
