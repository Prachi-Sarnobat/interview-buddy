import logging

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai import AIEvaluationError, evaluate_answer
from .models import InterviewSession, ProctoringEvent, QAExchange
from .serializers import (
    EvaluateAnswerRequestSerializer,
    InterviewSessionSerializer,
    QAExchangeSerializer,
    QAHistoryBulkSerializer,
    ProctoringEventRequestSerializer,
    ProctoringEventSerializer,
)

logger = logging.getLogger(__name__)


class InterviewSessionViewSet(viewsets.ModelViewSet):
    """
    POST   /api/sessions/          -> start a session, get its id
    PATCH  /api/sessions/<id>/     -> e.g. mark ended_at, tab_switch_count
    GET    /api/sessions/          -> list sessions (for "Review sessions")
    GET    /api/sessions/<id>/     -> one session
    """

    queryset = InterviewSession.objects.all()
    serializer_class = InterviewSessionSerializer


class EvaluateAnswerView(APIView):
    """
    POST /api/evaluate/

    Body:
      {"session_id": "<uuid, optional>", "question_id": "b1", "question": "...",
       "stage": "Backend: PostgreSQL & Django", "transcript": "candidate answer"}

    Response:
      {"score": 8, "verdict": "Strong answer", "strengths": [...], "improvements": [...]}

    If session_id is provided, the exchange (including the AI's evaluation) is
    saved to that session's Q&A history automatically. If you'd rather batch-save
    at the end of the interview instead, omit session_id here and use
    POST /api/sessions/<id>/qa-history/ once, at the end, with the full list.
    """

    def post(self, request):
        req = EvaluateAnswerRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data

        try:
            result = evaluate_answer(
                question=data["question"],
                stage=data["stage"],
                transcript=data["transcript"],
            )
        except AIEvaluationError as exc:
            logger.warning("AI evaluation failed: %s", exc)
            return Response(
                {"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        session_id = data.get("session_id")
        if session_id:
            try:
                session = InterviewSession.objects.get(pk=session_id)
                QAExchange.objects.create(
                    session=session,
                    question_id=data["question_id"],
                    question=data["question"],
                    stage=data["stage"],
                    transcript=data["transcript"],
                    order=data.get("order", 0),
                    **result,
                )
            except InterviewSession.DoesNotExist:
                logger.warning("Evaluate call referenced unknown session_id=%s", session_id)

        return Response(result, status=status.HTTP_200_OK)


class QAHistoryView(APIView):
    """
    GET  /api/sessions/<id>/qa-history/   -> list this session's Q&A history
    POST /api/sessions/<id>/qa-history/   -> bulk-save the full Q&A history at once

    POST body: {"qa_history": [{question_id, question, stage, transcript,
                                 score, verdict, strengths, improvements, order}, ...]}
    """

    def get(self, request, session_id):
        session = self._get_session(session_id)
        if session is None:
            return Response({"detail": "Session not found."}, status=404)
        qs = session.qa_history.all()
        return Response(QAExchangeSerializer(qs, many=True).data)

    def post(self, request, session_id):
        session = self._get_session(session_id)
        if session is None:
            return Response({"detail": "Session not found."}, status=404)

        body = QAHistoryBulkSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        # Replace any existing history for this session with the full list sent.
        session.qa_history.all().delete()
        exchanges = [
            QAExchange(session=session, **item)
            for item in body.validated_data["qa_history"]
        ]
        QAExchange.objects.bulk_create(exchanges)

        return Response(
            QAExchangeSerializer(session.qa_history.all(), many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _get_session(session_id):
        return InterviewSession.objects.filter(pk=session_id).first()


class ProctoringEventView(APIView):
    def post(self, request, session_id):
        session = InterviewSession.objects.filter(pk=session_id).first()
        if session is None:
            return Response({"detail": "Session not found."}, status=404)
        body = ProctoringEventRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        event = ProctoringEvent.objects.create(session=session, **body.validated_data)
        return Response(ProctoringEventSerializer(event).data, status=201)

    def get(self, request, session_id):
        session = InterviewSession.objects.filter(pk=session_id).first()
        if session is None:
            return Response({"detail": "Session not found."}, status=404)
        events = session.proctoring_events.all()
        return Response(ProctoringEventSerializer(events, many=True).data)
