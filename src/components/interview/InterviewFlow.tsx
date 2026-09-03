import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ConsentScreen } from "./ConsentScreen";
import { WebcamTile } from "./WebcamTile";
import { QuestionCard } from "./QuestionCard";
import { ScoreRing, scoreColor } from "./ScoreRing";
import { AvatarOrb } from "./AvatarOrb";
import {
  ALL_QUESTIONS,
  INTERVIEW_STAGES,
  evaluateAnswer,
  type AnswerRecord,
} from "./types";
import {
  createSession,
  logProctoringEvent,
  updateSession,
  type ProctoringEventType,
} from "@/lib/proctoring";

type Stage = "consent" | "share" | "intro" | "interview" | "summary";
type Phase = "speaking" | "listening" | "evaluating" | "recorded";

const SILENCE_MS = 2500;
const GREETING = "Hi, I'm Zara, your interviewer today. How's your day going?";
const TRANSITION = "Great, let's get started — first up, HTML and CSS.";

export function InterviewFlow() {
  const [stage, setStage] = useState<Stage>("consent");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("speaking");
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [introLine, setIntroLine] = useState(GREETING);
  const [introListening, setIntroListening] = useState(false);

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

  const question = ALL_QUESTIONS[index] ?? null;
  const total = ALL_QUESTIONS.length;

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
    if (stage !== "interview" && stage !== "intro") return;
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

  const speak = useCallback((text: string, onDone: () => void) => {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onend = onDone;
    u.onerror = onDone;
    synth.speak(u);
    const fallback = setTimeout(onDone, 18000);
    return () => {
      clearTimeout(fallback);
      synth.cancel();
    };
  }, []);

  const listen = useCallback(
    (onSilence: () => void) => {
      setTranscript("");
      transcriptRef.current = "";
      const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      const armSilence = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          if (transcriptRef.current.trim().length > 0) onSilence();
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
    },
    [],
  );

  /* ---------- warm opening ---------- */
  const finishIntro = useCallback(() => {
    stopRecognition();
    setIntroListening(false);
    setIntroLine(TRANSITION);
    speak(TRANSITION, () => {
      setTranscript("");
      transcriptRef.current = "";
      setIndex(0);
      setPhase("speaking");
      setStage("interview");
    });
  }, [speak, stopRecognition]);

  const finishIntroRef = useRef(finishIntro);
  finishIntroRef.current = finishIntro;

  useEffect(() => {
    if (stage !== "intro") return;
    setIntroLine(GREETING);
    const cleanup = speak(GREETING, () => {
      setIntroListening(true);
      listen(() => finishIntroRef.current());
    });
    return () => {
      cleanup?.();
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* ---------- answers ---------- */
  const submitAnswer = useCallback(async () => {
    if (phaseRef.current !== "listening" || !question) return;
    stopRecognition();
    setPhase("evaluating");
    const text = transcriptRef.current;
    const result = await evaluateAnswer(question, text);
    setAnswers((a) => [...a, { question, transcript: text, evaluation: result }]);
    setPhase("recorded");
  }, [question, stopRecognition]);

  const submitRef = useRef(submitAnswer);
  submitRef.current = submitAnswer;

  // read the question aloud, then listen
  useEffect(() => {
    if (stage !== "interview" || !question || phase !== "speaking") return;
    const cleanup = speak(`${question.text}`, () => {
      setPhase("listening");
      listen(() => void submitRef.current());
    });
    return () => {
      cleanup?.();
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, phase]);

  // "Answer recorded" beat, then straight to the next question
  useEffect(() => {
    if (phase !== "recorded") return;
    const t = setTimeout(() => advance(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const advance = () => {
    setTranscript("");
    transcriptRef.current = "";
    if (index + 1 < total) {
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

  const beginSession = () => {
    setIndex(0);
    setAnswers([]);
    setEvents([]);
    tabSwitchRef.current = 0;
    sessionId.current = null;
    void createSession("Full-stack sequence")
      .then((id) => {
        sessionId.current = id;
      })
      .catch(() => undefined);
    setStage("share");
  };

  const restart = () => {
    stopRecognition();
    window.speechSynthesis?.cancel();
    stopShare();
    sessionId.current = null;
    tabSwitchRef.current = 0;
    setIndex(0);
    setAnswers([]);
    setEvents([]);
    setTranscript("");
    setPhase("speaking");
    setStage("consent");
  };

  const tabSwitches = events.filter((e) => e.label.startsWith("Switched")).length;
  const avg = answers.length
    ? Math.round((answers.reduce((s, a) => s + a.evaluation.score, 0) / answers.length) * 10) / 10
    : 0;

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <header className="mx-auto mb-10 flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary font-mono text-xs font-semibold text-primary-foreground">
            Z
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
        {stage === "consent" && <ConsentScreen onAccept={beginSession} />}

        {stage === "share" && (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 2 / 2</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Share your screen</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Screen sharing keeps the session proctored. You can stop it at any time from the status bar.
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              Sequence: HTML &amp; CSS → React.js → Python → Node.js / PostgreSQL / Django.
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
                onClick={() => setStage("intro")}
                className="flex-1 rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
              >
                Meet Zara
              </button>
            </div>
          </div>
        )}

        {stage === "intro" && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <WebcamTile />
            </div>
            <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-14">
              <AvatarOrb state={introListening ? "listening" : "speaking"} />
              <p className="mt-8 max-w-md text-center text-xl leading-relaxed text-foreground transition-opacity duration-500">
                {introLine}
              </p>
              {introListening && (
                <>
                  <div className="mt-6 min-h-16 w-full max-w-md rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm text-foreground">
                    {transcript || <span className="text-muted-foreground">Say hi — this part isn't scored.</span>}
                  </div>
                  <button
                    onClick={finishIntro}
                    className="mt-6 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    I'm ready
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {stage === "interview" && question && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <WebcamTile />
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Stage</p>
                <p className="mt-2 text-sm text-foreground">{question.stage}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Screen share: {sharing ? "on" : "off"} · Tab switches: {tabSwitches}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                {ALL_QUESTIONS.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                      i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border"
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-12">
                <AvatarOrb
                  state={phase === "listening" ? "listening" : phase === "speaking" ? "speaking" : phase === "recorded" ? "recorded" : "idle"}
                  caption={phase === "evaluating" ? "Saving your answer" : undefined}
                />

                {phase === "listening" && (
                  <div className="mt-8 w-full max-w-xl">
                    <div className="min-h-24 rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                      {transcript || (
                        <span className="text-muted-foreground">
                          Start speaking — your answer appears here, and submits after a short pause.
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => void submitAnswer()}
                      className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Submit now
                    </button>
                  </div>
                )}

                {phase === "recorded" && (
                  <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-success">
                    Answer recorded — moving to the next question
                  </p>
                )}
              </div>

              <QuestionCard question={question} index={index} total={total} />
            </div>
          </div>
        )}

        {stage === "summary" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-6 rounded-3xl border border-border bg-card p-8">
              <ScoreRing score={avg} size={128} label="avg" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Interview summary</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full-stack sequence · {answers.length} of {total} questions answered
                </p>
              </div>
            </div>

            {INTERVIEW_STAGES.map((s) => {
              const rows = answers.filter((a) => a.question.stage === s.name);
              if (rows.length === 0) return null;
              const stageAvg =
                Math.round((rows.reduce((t, a) => t + a.evaluation.score, 0) / rows.length) * 10) / 10;
              return (
                <div key={s.id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.name}</p>
                    <span className="font-mono text-sm" style={{ color: scoreColor(stageAvg) }}>
                      {stageAvg}/10
                    </span>
                  </div>
                  <ul className="mt-4 space-y-5">
                    {rows.map((a) => (
                      <li key={a.question.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-foreground">{a.question.text}</span>
                          <span className="font-mono text-sm" style={{ color: scoreColor(a.evaluation.score) }}>
                            {a.evaluation.score}/10
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{a.evaluation.verdict}</p>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Your answer
                        </p>
                        <p className="mt-1 text-sm italic text-muted-foreground">
                          {a.transcript.trim() || "No speech captured."}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Section title="Strengths" items={a.evaluation.strengths} tone="text-success" />
                          <Section title="To improve" items={a.evaluation.improvements} tone="text-warning" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

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
              Start a new interview
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
