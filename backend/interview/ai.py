"""
Calls the configured AI provider to evaluate a candidate's answer and
returns a dict matching the frontend's expected shape:

    {"score": int, "verdict": str, "strengths": [str], "improvements": [str]}

Swapping providers later only means editing this file — nothing in
views.py needs to change.
"""

import json

from django.conf import settings


class AIEvaluationError(Exception):
    """Raised when the AI call fails or returns something we can't parse."""


SYSTEM_PROMPT = (
    "You are a strict but fair technical interviewer evaluating a candidate's "
    "spoken answer during a live full-stack developer interview. "
    "Score the answer from 0 to 10. Reply with ONLY a JSON object, no prose, "
    "no markdown fences, in exactly this shape:\n"
    '{"score": <0-10 integer>, "verdict": "<one short sentence>", '
    '"strengths": ["<short point>", ...], "improvements": ["<short point>", ...]}\n'
    "strengths and improvements should each have 1-3 short bullet-style points. "
    "If the transcript is empty, off-topic, or clearly not an attempt to answer, "
    "score it low and say so plainly in the verdict."
)


def _build_user_prompt(question: str, stage: str, transcript: str) -> str:
    return (
        f"Interview stage: {stage}\n"
        f"Question: {question}\n"
        f"Candidate's answer (transcribed from speech): {transcript}"
    )


def _parse_ai_json(raw_text: str) -> dict:
    raw_text = raw_text.strip()
    # Strip accidental markdown fences if the model adds them anyway.
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        raw_text = raw_text.split("\n", 1)[-1] if "\n" in raw_text else raw_text
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise AIEvaluationError(f"AI response wasn't valid JSON: {raw_text[:200]}") from exc

    score = data.get("score")
    if not isinstance(score, int):
        try:
            score = int(score)
        except (TypeError, ValueError):
            raise AIEvaluationError(f"AI response had a non-numeric score: {score!r}")

    return {
        "score": max(0, min(10, score)),
        "verdict": str(data.get("verdict", "")).strip(),
        "strengths": list(data.get("strengths", []))[:3],
        "improvements": list(data.get("improvements", []))[:3],
    }


def _evaluate_with_openai(question: str, stage: str, transcript: str) -> dict:
    if not settings.OPENAI_API_KEY:
        return _mock_evaluation(transcript)

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise AIEvaluationError("Install the OpenAI package or use AI_PROVIDER=mock.") from exc

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(question, stage, transcript)},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    raw_text = response.choices[0].message.content
    return _parse_ai_json(raw_text)


def _evaluate_with_gemini(question: str, stage: str, transcript: str) -> dict:
    if not settings.GEMINI_API_KEY:
        return _mock_evaluation(transcript)

    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise AIEvaluationError("Install the Gemini package or use AI_PROVIDER=mock.") from exc

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        settings.GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json"},
    )
    response = model.generate_content(_build_user_prompt(question, stage, transcript))
    return _parse_ai_json(response.text)


def evaluate_answer(question: str, stage: str, transcript: str) -> dict:
    provider = settings.AI_PROVIDER
    if provider == "mock":
        return _mock_evaluation(transcript)
    if provider == "openai":
        return _evaluate_with_openai(question, stage, transcript)
    if provider == "gemini":
        return _evaluate_with_gemini(question, stage, transcript)
    raise AIEvaluationError(f"Unknown AI_PROVIDER: {provider!r}")


def _mock_evaluation(transcript: str) -> dict:
    """Keep local development usable until an AI provider key is configured."""
    score = 7 if len(transcript.strip()) >= 80 else 5 if transcript.strip() else 2
    return {
        "score": score,
        "verdict": "Development evaluation: connect an AI provider for live scoring.",
        "strengths": ["Answer was captured successfully."],
        "improvements": ["Configure an AI provider for detailed feedback."],
    }
