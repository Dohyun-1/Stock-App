from celery import Celery
from celery.utils import sysinfo as celery_sysinfo

from core.models import RunRequest
from core.orchestrator import orchestrator
from core.settings import settings

# Some macOS/sandbox environments raise OSError on os.getloadavg().
# Celery heartbeat relies on this call, so guard it to keep worker stable.
_orig_load_average = celery_sysinfo.load_average


def _safe_load_average():
    try:
        return _orig_load_average()
    except Exception:
        return (0.0, 0.0, 0.0)


celery_sysinfo.load_average = _safe_load_average

celery_app = Celery(
    "investment_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)


@celery_app.task(bind=True, name="pipeline.run")
def run_pipeline(self, payload: dict) -> dict:
    request = RunRequest.model_validate(payload)
    run_id = getattr(self.request, "id", None) or "unknown-run"
    status, decision = orchestrator.execute_run(request=request, run_id=run_id)
    return {
        "status": status.model_dump(mode="json"),
        "decision": decision.model_dump(mode="json") if decision else None,
        "events": orchestrator.get_events(run_id),
    }
