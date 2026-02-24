from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////data/elementa.db"
    SECRET_KEY: str = "changeme_secret_key_please_update"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FIRST_ADMIN_USERNAME: str = "admin"
    FIRST_ADMIN_PASSWORD: str = "changeme123"
    FIRST_ADMIN_EMAIL: str = "admin@elementa.local"

    class Config:
        env_file = ".env"


settings = Settings()
