from core.models import CommitteeDecision


class PolicyEngine:
    def validate_decision(self, decision: CommitteeDecision) -> tuple[bool, str]:
        total_weight = sum(a.target_weight for a in decision.allocations)
        if total_weight > 1.0001:
            return False, "allocation sum exceeds 100%"
        if decision.confidence < 0.0 or decision.confidence > 1.0:
            return False, "confidence out of range"
        return True, "ok"
