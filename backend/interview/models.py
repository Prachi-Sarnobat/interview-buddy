import uuid

from django.db import models


class InterviewSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate_label = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    screen_share_active = models.BooleanField(default=False)
    tab_switch_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Session {self.id} ({self.started_at:%Y-%m-%d %H:%M})"


class QAExchange(models.Model):
    """One question + candidate answer + AI evaluation, tied to a session."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        InterviewSession, related_name="qa_history", on_delete=models.CASCADE
    )
    question_id = models.CharField(max_length=64)  # e.g. "b1" from the frontend
    question = models.TextField()
    stage = models.CharField(max_length=128)  # e.g. "Backend: PostgreSQL & Django"
    transcript = models.TextField()

    score = models.IntegerField(null=True, blank=True)
    verdict = models.CharField(max_length=255, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)

    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.question_id} — {self.stage}"


class ProctoringEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        InterviewSession, related_name="proctoring_events", on_delete=models.CASCADE
    )
    event_type = models.CharField(max_length=64)
    label = models.CharField(max_length=255)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["occurred_at"]

    def __str__(self):
        return f"{self.event_type}: {self.label}"
