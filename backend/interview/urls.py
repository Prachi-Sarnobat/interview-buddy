from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    EvaluateAnswerView,
    InterviewSessionViewSet,
    ProctoringEventView,
    QAHistoryView,
)

router = DefaultRouter()
router.register("sessions", InterviewSessionViewSet, basename="session")

urlpatterns = router.urls + [
    path("evaluate/", EvaluateAnswerView.as_view(), name="evaluate-answer"),
    path(
        "sessions/<uuid:session_id>/qa-history/",
        QAHistoryView.as_view(),
        name="qa-history",
    ),
    path(
        "sessions/<uuid:session_id>/events/",
        ProctoringEventView.as_view(),
        name="proctoring-events",
    ),
]
