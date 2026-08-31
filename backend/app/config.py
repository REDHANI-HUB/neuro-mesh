import os

class Settings:
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "neuromesh")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "neuromesh_secret")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "neuromesh_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
