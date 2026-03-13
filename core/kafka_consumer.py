import asyncio
import json

from core.event_bus import EventBus
from core.settings import settings


async def _run() -> None:
    if not settings.use_kafka:
        print("Kafka disabled. Set USE_KAFKA=true to consume events.")
        return

    bus = EventBus()
    print(f"Consuming topic={settings.kafka_topic_events} bootstrap={settings.kafka_bootstrap_servers}")
    while True:
        messages = await bus.consume_kafka_once(max_messages=100, timeout_ms=1000)
        for msg in messages:
            print(json.dumps(msg, ensure_ascii=False))
        await asyncio.sleep(0.2)


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
