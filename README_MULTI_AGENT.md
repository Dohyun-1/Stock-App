# Multi-Agent Investment Platform

Production-grade scaffold for hedge-fund style research workflows.

## Modules

- `core`: orchestration, registry, policy, schema contracts
- `data`: ingestion, normalization, feature snapshots
- `agents`: philosophy-specific research agents
- `debate`: multi-round argument and contradiction handling
- `risk`: limits, stress scenarios, exposure checks
- `backtesting`: historical simulation with costs/slippage
- `portfolio`: optimization, sizing, rebalance planning
- `committee`: final vote and decision packaging

## Environment

Create `.env` (optional):

```bash
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
USE_KAFKA=false
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_EVENTS=investment.events
KAFKA_CONSUMER_GROUP=investment-platform
```

## Run

- API: `uvicorn orchestration_api:app --host 0.0.0.0 --port 8000`
- Worker: `celery -A worker.celery_app worker --loglevel=info`
- Kafka consumer: `python3 -m core.kafka_consumer`

## Async API

- `POST /runs/start` -> enqueue Celery pipeline, returns `run_id`(task id)
- `GET /runs/{run_id}` -> task state mapped to run status
- `GET /decision/{run_id}` -> final committee decision after completion

## Contract

All module communication must use envelope+payload JSON schemas in `core/schemas`.
