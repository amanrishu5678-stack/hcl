from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

def now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="VIEWER")

class Equipment(Base):
    __tablename__ = "equipment"
    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_id: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(80))
    manufacturer: Mapped[str] = mapped_column(String(100), default="Industrial Systems")
    model: Mapped[str] = mapped_column(String(100), default="Demo-X")
    location: Mapped[str] = mapped_column(String(120))
    production_line: Mapped[str] = mapped_column(String(100))
    department: Mapped[str] = mapped_column(String(100))
    device_id: Mapped[str] = mapped_column(String(80), unique=True)
    operating_hours: Mapped[float] = mapped_column(Float, default=0)
    health_score: Mapped[float] = mapped_column(Float, default=95)
    status: Mapped[str] = mapped_column(String(30), default="EXCELLENT")
    risk_level: Mapped[str] = mapped_column(String(30), default="LOW")
    last_maintenance: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_maintenance: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=now)
    temperature: Mapped[float] = mapped_column(Float)
    vibration: Mapped[float] = mapped_column(Float)
    current: Mapped[float] = mapped_column(Float)
    voltage: Mapped[float] = mapped_column(Float)
    pressure: Mapped[float] = mapped_column(Float)
    rpm: Mapped[float] = mapped_column(Float)
    runtime_hours: Mapped[float] = mapped_column(Float)

class HealthScore(Base):
    __tablename__ = "health_scores"
    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=now)
    score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30))
    risk_level: Mapped[str] = mapped_column(String(30))
    explanation: Mapped[str] = mapped_column(Text)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=now)
    severity: Mapped[str] = mapped_column(String(30))
    sensor: Mapped[str] = mapped_column(String(50))
    observed_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_range: Mapped[str] = mapped_column(String(120), default="")
    description: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    technician: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    parts_replaced: Mapped[str] = mapped_column(Text, default="")
    downtime_hours: Mapped[float] = mapped_column(Float, default=0)
