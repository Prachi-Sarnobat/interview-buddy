from rest_framework import serializers

from .models import InterviewSession, ProctoringEvent, QAExchange


class InterviewSessionSerializer(serializers.ModelSerializer):
	class Meta:
		model = InterviewSession
		fields = [
			"id",
			"candidate_label",
			"started_at",
			"ended_at",
			"screen_share_active",
			"tab_switch_count",
			"created_at",
		]
		read_only_fields = ["id", "started_at", "created_at"]


class QAExchangeSerializer(serializers.ModelSerializer):
	class Meta:
		model = QAExchange
		fields = [
			"id",
			"question_id",
			"question",
			"stage",
			"transcript",
			"score",
			"verdict",
			"strengths",
			"improvements",
			"order",
			"created_at",
		]
		read_only_fields = ["id", "created_at"]


class EvaluateAnswerRequestSerializer(serializers.Serializer):
	session_id = serializers.UUIDField(required=False, allow_null=True)
	question_id = serializers.CharField(max_length=64)
	question = serializers.CharField()
	stage = serializers.CharField(max_length=128)
	transcript = serializers.CharField(allow_blank=True)
	order = serializers.IntegerField(required=False, min_value=0, default=0)


class QAHistoryBulkSerializer(serializers.Serializer):
	qa_history = QAExchangeSerializer(many=True)


class ProctoringEventSerializer(serializers.ModelSerializer):
	class Meta:
		model = ProctoringEvent
		fields = ["id", "event_type", "label", "occurred_at"]
		read_only_fields = ["id", "occurred_at"]


class ProctoringEventRequestSerializer(serializers.Serializer):
	event_type = serializers.CharField(max_length=64)
	label = serializers.CharField(max_length=255)
