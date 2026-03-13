from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    use_kafka: bool = False
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_events: str = "investment.events"
    kafka_consumer_group: str = "investment-platform"


settings = Settings()
