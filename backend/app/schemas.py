from datetime import datetime
from pydantic import BaseModel, Field

class Telemetry(BaseModel):
    device_id: str
    equipment_id: str
    timestamp: datetime
    temperature: float = Field(ge=-40, le=180)
    vibration: float = Field(ge=0, le=100)
    current: float = Field(ge=0, le=1000)
    voltage: float = Field(ge=0, le=1000)
    pressure: float = Field(ge=0, le=1000)
    rpm: float = Field(ge=0, le=100000)
    runtime_hours: float = Field(ge=0, le=1_000_000)

class LoginRequest(BaseModel):
    email: str
    password: str

class AlertAction(BaseModel):
    pass
