# Architecture

The platform separates edge acquisition, transport, ingestion, persistence, ML inference, scoring, alerting and presentation.

MQTT is the transport boundary. FastAPI validates payloads before persistence. The health engine is deterministic and explainable; Isolation Forest provides unsupervised anomaly detection when trained artifacts are available.
