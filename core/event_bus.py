import asyncio
import json
from typing import Any

import orjson
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from core.models import MessageEnvelope
from core.settings import settings


class EventBus:
    """Hybrid event bus: in-memory + optional Kafka publish/consume."""

    def __init__(self) -> None:
        self._events: list[MessageEnvelope] = []

    def publish(self, envelope: MessageEnvelope) -> None:
        self._events.append(envelope)
        if settings.use_kafka:
            asyncio.run(self._publish_kafka(envelope))

    async def _publish_kafka(self, envelope: MessageEnvelope) -> None:
        producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: orjson.dumps(v),
        )
        await producer.start()
        try:
            await producer.send_and_wait(
                settings.kafka_topic_events,
                envelope.model_dump(mode="json"),
            )
        finally:
            await producer.stop()

    async def consume_kafka_once(self, max_messages: int = 50, timeout_ms: int = 1000) -> list[dict[str, Any]]:
        if not settings.use_kafka:
            return []

        consumer = AIOKafkaConsumer(
            settings.kafka_topic_events,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_consumer_group,
            enable_auto_commit=True,
            value_deserializer=lambda b: json.loads(b.decode("utf-8")),
        )
        await consumer.start()
        messages: list[dict[str, Any]] = []
        try:
            batch = await consumer.getmany(timeout_ms=timeout_ms, max_records=max_messages)
            for _, records in batch.items():
                for record in records:
                    if isinstance(record.value, dict):
                        messages.append(record.value)
        finally:
            await consumer.stop()
        return messages

    def pull_run_events(self, run_id: str) -> list[dict[str, Any]]:
        return [json.loads(e.model_dump_json()) for e in self._events if e.run_id == run_id]
