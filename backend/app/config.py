import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_PATH = os.path.join(_BASE_DIR, ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{os.path.join(_BASE_DIR, 'ganpati.db')}"
    JWT_SECRET: str = "ganpati-bappa-morya-super-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = os.path.join(_BASE_DIR, "static", "uploads")
    PHOTOS_DIR: str = os.path.join(_BASE_DIR, "static", "uploads", "photos")
    PDFS_DIR: str = os.path.join(_BASE_DIR, "static", "uploads", "pdfs")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]
    USE_CLOUD_STORAGE: bool = False
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET_NAME: str = ""
    AWS_S3_CUSTOM_DOMAIN: str = ""
    AWS_CLOUDFRONT_DOMAIN: str = ""
    APP_TITLE: str = "गणपती बाप्पा बुकिंग सिस्टीम"
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=_ENV_PATH if os.path.exists(_ENV_PATH) else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Create upload directories on import
os.makedirs(settings.PHOTOS_DIR, exist_ok=True)
os.makedirs(settings.PDFS_DIR, exist_ok=True)

