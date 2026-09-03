import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ConsentScreen } from "./ConsentScreen";
import { TopicSelect } from "./TopicSelect";
import { WebcamTile } from "./WebcamTile";
import { QuestionCard } from "./QuestionCard";
import { ScoreRing } from "./ScoreRing";
import { evaluateAnswer, type AnswerRecord, type Evaluation, type Topic } from "./types";
import {
  createSession,
  logProctoringEvent,
  updateSession,
  type ProctoringEventType,
} from "@/lib/proctoring";


type Stage = "consent" | "topic" | "share" | "interview" | "summary";
type Phase = "speaking" | "listening" | "evaluating" | "feedback";

const SILENCE_MS = 2500;

export function InterviewFlow() {
  const [stage, setStage] = useState<Stage>("consent");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("speaking");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // proctoring
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ label: string; at: string }[]>([]);
  const shareStream = useRef<MediaStream | null>(null);
  const sessionId = useRef<string | null>(null);
  const tabSwitchRef = useRef(0);

  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");
  const phaseRef = useRef<Phase>("speaking");
  phaseRef.current = phase;

  const question = topic?.questions[index] ?? null;

  const logEvent = useCallback((type: ProctoringEventType, label: string) => {
    setEvents((e) => [...e, { label, at: new Date().toLocaleTimeString() }]);
    const id = sessionId.current;
    if (!id) return;
    void logProctoringEvent(id, type, label).catch(() => undefined);
    if (type === "tab_switch") {
      tabSwitchRef.current += 1;
      void updateSession(id, { tab_switch_count: tabSwitchRef.current }).catch(() => undefined);
    }
    if (type === "share_started" || type === "share_stopped") {
      void updateSession(id, { screen_share_active: type === "share_started" }).catch(() => undefined);
    }
  }, []);

  /* ---------- proctoring: tab switch / blur ---------- */
  useEffect(() => {
    if (stage !== "interview") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") logEvent("tab_switch", "Switched away from the interview tab");
    };
    const onBlur = () => logEvent("window_blur", "Interview window lost focus");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, [stage, logEvent]);

  /* ---------- screen share ---------- */
  const startShare = async () => {
    setShareError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      shareStream.current = stream;
      setSharing(true);
      logEvent("share_started", "Screen sharing started");
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setSharing(false);
        shareStream.current = null;
        logEvent("share_stopped", "Screen sharing stopped");
      });
    } catch {
      setShareError("Screen sharing was not allowed. You can continue without it.");
    }
  };

  const stopShare = () => {
    if (!shareStream.current && !sharing) return;
    shareStream.current?.getTracks().forEach((t) => t.stop());
    shareStream.current = null;
    setSharing(false);
    logEvent("share_stopped", "Screen sharing stopped");
  };


  /* ---------- speech ---------- */
  const stopRecognition = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
  }, []);

  const submitAnswer = useCallback(async () => {
    if (phaseRef.current !== "listening" || !question) return;
    stopRecognition();
    setPhase("evaluating");
    const text = transcriptRef.current;
    const result = await evaluateAnswer(question, text);
    setEvaluation(result);
    setAnswers((a) => [...a, { question, transcript: text, evaluation: result }]);
    setPhase("feedback");
  }, [question, stopRecognition]);

  const startListening = useCallback(() => {
    setPhase("listening");
    setTranscript("");
    transcriptRef.current = "";

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      transcriptRef.current = "";
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    const armSilence = () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (transcriptRef.current.trim().length > 0) void submitAnswer();
      }, SILENCE_MS);
    };

    rec.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      transcriptRef.current = text;
      setTranscript(text);
      armSilence();
    };
    rec.onerror = () => armSilence();
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      /* noop */
    }
  }, [submitAnswer]);

  // read the question aloud, then listen
  useEffect(() => {
    if (stage !== "interview" || !question || phase !== "speaking") return;
    let cancelled = false;
    const synth = window.speechSynthesis;
    const goListen = () => {
      if (!cancelled) startListening();
    };
    if (synth && typeof SpeechSynthesisUtterance !== "undefined") {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(question.text);
      u.rate = 1;
      u.onend = goListen;
      u.onerror = goListen;
      synth.speak(u);
      const fallback = setTimeout(goListen, 15000);
      return () => {
        cancelled = true;
        clearTimeout(fallback);
        synth.cancel();
      };
    }
    const t = setTimeout(goListen, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [stage, question, phase, startListening]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const next = () => {
    setEvaluation(null);
    setTranscript("");
    transcriptRef.current = "";
    if (topic && index + 1 < topic.questions.length) {
      setIndex(index + 1);
      setPhase("speaking");
    } else {
      window.speechSynthesis?.cancel();
      if (sessionId.current) {
        void updateSession(sessionId.current, { ended_at: new Date().toISOString() }).catch(() => undefined);
      }
      setStage("summary");
    }
  };

  const restart = () => {
    stopRecognition();
    window.speechSynthesis?.cancel();
    stopShare();
    sessionId.current = null;
    tabSwitchRef.current = 0;
    setTopic(null);
    setIndex(0);
    setAnswers([]);
    setEvents([]);
    setEvaluation(null);
    setTranscript("");
    setPhase("speaking");
    setStage("topic");
  };

  const tabSwitches = events.filter((e) => e.label.startsWith("Switched")).length;


  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <header className="mx-auto mb-10 flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary font-mono text-xs font-semibold text-primary-foreground">
            AI
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">AI Interviewer</span>
        </div>
        {sharing && (
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              You are sharing your screen
            </span>
            <button onClick={stopShare} className="font-mono text-[10px] uppercase tracking-widest text-danger">
              Stop sharing
            </button>
          </div>
        )}
        <Link to="/review" className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Review sessions
        </Link>
      </header>

      <div className="mx-auto max-w-5xl">
        {stage === "consent" && <ConsentScreen onAccept={() => setStage("topic")} />}

        {stage === "topic" && (
          <TopicSelect
            onPick={(t) => {
              setTopic(t);
              setIndex(0);
              setAnswers([]);
              setEvents([]);
              tabSwitchRef.current = 0;
              sessionId.current = null;
              void createSession(t.name)
                .then((id) => {
                  sessionId.current = id;
                })
                .catch(() => undefined);
              setStage("share");
            }}
          />
        )}


        {stage === "share" && (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 3 / 3</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Share your screen</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Screen sharing keeps the session proctored. You can stop it at any time from the status bar.
            </p>
            {shareError && <p className="mt-3 font-mono text-[11px] text-warning">{shareError}</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={startShare}
                disabled={sharing}
                className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {sharing ? "Screen shared" : "Share your screen"}
              </button>
              <button
                onClick={() => setStage("interview")}
                className="flex-1 rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
              >
                Begin interview
              </button>
            </div>
          </div>
        )}

        {stage === "interview" && topic && question && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <WebcamTile />
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Session</p>
                <p className="mt-2 text-sm text-foreground">{topic.name}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Screen share: {sharing ? "on" : "off"} · Tab switches: {tabSwitches}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                {topic.questions.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border"}`}
                  />
                ))}
              </div>

              <QuestionCard question={question} index={index} total={topic.questions.length} />

              {phase === "speaking" && (
                <div className="flex items-center gap-2 rounded-3xl border border-border bg-card px-6 py-4">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    AI speaking
                  </span>
                </div>
              )}

              {phase === "listening" && (
                <div className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
                      Listening
                    </span>
                    <button
                      onClick={() => void submitAnswer()}
                      className="rounded-2xl bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Submit now
                    </button>
                  </div>
                  <div className="mt-4 min-h-28 rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                    {transcript || (
                      <span className="text-muted-foreground">
                        Start speaking — your answer appears here, and submits after a short pause.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {phase === "evaluating" && (
                <div className="flex items-center gap-3 rounded-3xl border border-border bg-card px-6 py-8">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Evaluating your answer
                  </span>
                </div>
              )}

              {phase === "feedback" && evaluation && (
                <div className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center gap-6">
                    <ScoreRing score={evaluation.score} />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Verdict</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{evaluation.verdict}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Section title="Strengths" items={evaluation.strengths} tone="text-success" />
                    <Section title="To improve" items={evaluation.improvements} tone="text-warning" />
                  </div>
                  <button
                    onClick={next}
                    className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {index + 1 < topic.questions.length ? "Next question" : "See summary"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {stage === "summary" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-6 rounded-3xl border border-border bg-card p-8">
              <ScoreRing
                score={
                  answers.length
                    ? Math.round((answers.reduce((s, a) => s + a.evaluation.score, 0) / answers.length) * 10) / 10
                    : 0
                }
                size={128}
                label="avg"
              />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Interview summary</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic?.name} · {answers.length} questions answered
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Per question</p>
              <ul className="mt-4 space-y-3">
                {answers.map((a) => (
                  <li key={a.question.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-sm text-foreground">{a.question.text}</span>
                    <span className="font-mono text-sm" style={{ color: a.evaluation.score >= 8 ? "var(--color-success)" : a.evaluation.score >= 5 ? "var(--color-warning)" : "var(--color-danger)" }}>
                      {a.evaluation.score}/10
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Proctoring notes</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Tab switches recorded: <span className="font-mono text-foreground">{tabSwitches}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Screen sharing at the end of the session:{" "}
                <span className="font-mono text-foreground">{sharing ? "active" : "not active"}</span>
              </p>
              {events.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {events.map((e, i) => (
                    <li key={i} className="font-mono text-[11px] text-muted-foreground">
                      {e.at} — {e.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={restart}
              className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start another topic
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className={`font-mono text-[10px] uppercase tracking-widest ${tone}`}>{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((i) => (
          <li key={i} className="text-sm text-muted-foreground">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
