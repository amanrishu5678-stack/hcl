from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "app" / "ml_models"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{(DATA_DIR / 'indusense.db').as_posix()}"
    jwt_secret: str = "indusense-local-demo-secret-change-me"
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_enabled: bool = False
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    model_dir: str = str(MODEL_DIR)

    model_config = SettingsConfigDict(env_file=str(PROJECT_ROOT / ".env"), extra="ignore")

settings = Settings()
