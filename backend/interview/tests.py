from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .models import InterviewSession, ProctoringEvent, QAExchange


class InterviewApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_create_session_and_update_proctoring(self):
		response = self.client.post(
			"/api/sessions/", {"candidate_label": "Test candidate"}, format="json"
		)
		self.assertEqual(response.status_code, 201)
		session_id = response.data["id"]

		event_response = self.client.post(
			f"/api/sessions/{session_id}/events/",
			{"event_type": "tab_switch", "label": "Switched away"},
			format="json",
		)
		self.assertEqual(event_response.status_code, 201)
		self.assertEqual(ProctoringEvent.objects.count(), 1)

		patch_response = self.client.patch(
			f"/api/sessions/{session_id}/",
			{"tab_switch_count": 1},
			format="json",
		)
		self.assertEqual(patch_response.status_code, 200)
		self.assertEqual(patch_response.data["tab_switch_count"], 1)

	@patch("interview.views.evaluate_answer")
	def test_evaluate_answer_persists_exchange(self, evaluate):
		evaluate.return_value = {
			"score": 8,
			"verdict": "Strong answer",
			"strengths": ["Clear explanation"],
			"improvements": ["Add an example"],
		}
		session = InterviewSession.objects.create(candidate_label="Candidate")
		response = self.client.post(
			"/api/evaluate/",
			{
				"session_id": str(session.id),
				"question_id": "b1",
				"question": "How do indexes work?",
				"stage": "Backend: PostgreSQL & Django",
				"transcript": "Indexes speed up lookups.",
				"order": 2,
			},
			format="json",
		)
		self.assertEqual(response.status_code, 200)
		self.assertEqual(QAExchange.objects.get().score, 8)

	def test_bulk_history_and_read_history(self):
		session = InterviewSession.objects.create()
		payload = {
			"qa_history": [{
				"question_id": "p1",
				"question": "What is a tuple?",
				"stage": "Python",
				"transcript": "An immutable sequence.",
				"score": 7,
				"verdict": "Solid",
				"strengths": ["Accurate"],
				"improvements": ["Give an example"],
				"order": 0,
			}]
		}
		response = self.client.post(
			f"/api/sessions/{session.id}/qa-history/", payload, format="json"
		)
		self.assertEqual(response.status_code, 201)
		history = self.client.get(f"/api/sessions/{session.id}/qa-history/")
		self.assertEqual(history.status_code, 200)
		self.assertEqual(len(history.data), 1)
