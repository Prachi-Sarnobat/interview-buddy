import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ConsentScreen } from "./ConsentScreen";
import { WebcamTile } from "./WebcamTile";
import { QuestionCard } from "./QuestionCard";
import { ScoreRing } from "./ScoreRing";
import { QUESTIONS, STAGES, evaluateAnswer } from "./types";
import { createSession, logProctoringEvent, updateSession } from "@/lib/proctoring";

const SILENCE_MS = 2500;

export function InterviewFlow() {
  const [screen, setScreen] = useState("consent");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("opening");
  const [transcript, setTranscript] = useState("");
  const [evaluationError, setEvaluationError] = useState("");
  const [answers, setAnswers] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [events, setEvents] = useState([]);
  const shareStream = useRef(null);
  const sessionId = useRef(null);
  const tabSwitchRef = useRef(0);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const transcriptRef = useRef("");
  const phaseRef = useRef(phase);
  const openingRef = useRef(true);
  phaseRef.current = phase;
  const question = QUESTIONS[index];

  const logEvent = useCallback((type, label) => {
    setEvents(current => [...current, { label, at: new Date().toLocaleTimeString() }]);
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

  useEffect(() => {
    if (screen !== "interview") return undefined;
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
  }, [screen, logEvent]);

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
    shareStream.current?.getTracks().forEach(track => track.stop());
    shareStream.current = null;
    setSharing(false);
    logEvent("share_stopped", "Screen sharing stopped");
  };

  const stopRecognition = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    recognitionRef.current = null;
  }, []);

  const submitAnswer = useCallback(async () => {
    if (phaseRef.current !== "listening") return;
    stopRecognition();
    const text = transcriptRef.current.trim();
    if (openingRef.current) {
      openingRef.current = false;
      setTranscript("");
      transcriptRef.current = "";
      setPhase("speaking");
      return;
    }
    setPhase("evaluating");
    try {
      const evaluation = await evaluateAnswer(question, text, sessionId.current, index);
      setAnswers(current => [...current, { question, transcript: text, evaluation }]);
      setEvaluationError("");
      setPhase("recorded");
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : "Could not save your answer.");
      setPhase("listening");
    }
  }, [question, stopRecognition]);

  const startListening = useCallback(() => {
    setPhase("listening");
    setTranscript("");
    transcriptRef.current = "";
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    const armSilence = () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (transcriptRef.current.trim()) void submitAnswer();
      }, SILENCE_MS);
    };
    recognition.onresult = event => {
      let text = "";
      for (let resultIndex = 0; resultIndex < event.results.length; resultIndex += 1) {
        text += event.results[resultIndex][0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text);
      armSilence();
    };
    recognition.onerror = armSilence;
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* noop */ }
  }, [submitAnswer]);

  useEffect(() => {
    if (screen !== "interview" || phase !== "speaking") return undefined;
    let cancelled = false;
    const synth = window.speechSynthesis;
    const spokenText = openingRef.current
      ? "Hi, I'm Zara, your interviewer today. How's your day going?"
      : index === 0
        ? "Great, let's get started. First up, HTML and CSS."
        : question.text;
    const goListen = () => { if (!cancelled) startListening(); };
    if (synth && typeof SpeechSynthesisUtterance !== "undefined") {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const femaleVoice = synth.getVoices().find(voice => /samantha|victoria|ava|allison|emma|zoe|aria|jenny|zira|female|woman/i.test(voice.name) && /^en(-|_)/i.test(voice.lang))
        ?? synth.getVoices().find(voice => /^en(-|_)/i.test(voice.lang));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1;
      utterance.onend = goListen;
      utterance.onerror = goListen;
      synth.speak(utterance);
      const fallback = setTimeout(goListen, 15000);
      return () => { cancelled = true; clearTimeout(fallback); synth.cancel(); };
    }
    const fallback = setTimeout(goListen, 1000);
    return () => { cancelled = true; clearTimeout(fallback); };
  }, [screen, phase, index, question, startListening]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const beginSession = async () => {
    sessionId.current = null;
    tabSwitchRef.current = 0;
    setAnswers([]);
    setEvaluationError("");
    setEvents([]);
    try {
      sessionId.current = await createSession("Full-stack sequence");
    } catch {
      sessionId.current = null;
    }
    setScreen("share");
  };

  const beginInterview = () => {
    openingRef.current = true;
    setIndex(0);
    setPhase("speaking");
    setScreen("interview");
  };

  const next = () => {
    if (index + 1 < QUESTIONS.length) {
      setIndex(current => current + 1);
      setPhase("speaking");
    } else {
      window.speechSynthesis?.cancel();
      if (sessionId.current) void updateSession(sessionId.current, { ended_at: new Date().toISOString() }).catch(() => undefined);
      setScreen("summary");
    }
  };

  const restart = () => {
    stopRecognition();
    window.speechSynthesis?.cancel();
    stopShare();
    sessionId.current = null;
    openingRef.current = true;
    setIndex(0);
    setAnswers([]);
    setEvents([]);
    setTranscript("");
    setPhase("opening");
    setScreen("consent");
  };

  const tabSwitches = events.filter(event => event.label.startsWith("Switched")).length;
  const currentStage = STAGES[question.stageIndex];

  return <main className="min-h-screen bg-transparent px-4 py-8 sm:px-8">
    <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
      <div className="brand-lockup"><span className="brand-mark">Z</span><div><p className="brand-name">Zara</p><p className="brand-subtitle">AI Interviewer</p></div></div>
      {sharing && <div className="share-pill"><span>Screen sharing active</span><button onClick={stopShare}>Stop sharing</button></div>}
      <Link to="/review" className="font-mono text-[10px] uppercase tracking-widest text-primary">Review sessions</Link>
    </header>
    <div className="mx-auto max-w-6xl">
      {screen === "consent" && <ConsentScreen onAccept={beginSession} />}
      {screen === "share" && <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step 2 / 3</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Share your screen</h1><p className="mt-3 text-sm text-muted-foreground">Your full-stack interview moves through HTML & CSS, React.js, Python, then backend systems.</p>{shareError && <p className="mt-3 font-mono text-[11px] text-warning">{shareError}</p>}<div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={startShare} disabled={sharing} className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{sharing ? "Screen shared" : "Share your screen"}</button><button onClick={beginInterview} className="flex-1 rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:border-primary">Begin interview</button></div></div>}
      {screen === "interview" && question && <div className="grid gap-6 lg:grid-cols-[260px_1fr]"><div className="space-y-4"><WebcamTile /><div className="rounded-3xl border border-border bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Session</p><p className="mt-2 text-sm text-foreground">Full-stack sequence</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">Stage {question.stageIndex + 1} · {currentStage.name}<br />Screen share: {sharing ? "on" : "off"} · Tab switches: {tabSwitches}</p></div></div><div className="space-y-5"><div className="flex gap-1.5">{QUESTIONS.map((item, itemIndex) => <span key={item.id} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${itemIndex < index ? "bg-primary" : itemIndex === index ? "bg-primary/60" : "bg-border"}`} />)}</div><div className="stage-kicker">Stage {question.stageIndex + 1} · {currentStage.name}</div><Avatar phase={phase} /><QuestionCard question={question} index={index} total={QUESTIONS.length} />{phase === "listening" && <div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-danger" />Listening</span><button onClick={() => void submitAnswer()} className="rounded-2xl bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-primary-foreground">Submit now</button></div><div className="mt-4 min-h-28 rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">{transcript || <span className="text-muted-foreground">Start speaking. Your answer submits after a short pause.</span>}</div></div>}{phase === "evaluating" && <div className="status-panel"><span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" /><span>Saving your answer</span></div>}{phase === "recorded" && <div className="recorded-panel"><div><p className="font-mono text-[10px] uppercase tracking-widest text-success">Answer recorded</p><p className="mt-1 text-sm text-muted-foreground">Your response is saved for the final review.</p></div><button onClick={next} className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">{index + 1 < QUESTIONS.length ? "Continue" : "See summary"}</button></div>}</div></div>}
      {screen === "summary" && <Summary answers={answers} events={events} sharing={sharing} tabSwitches={tabSwitches} onRestart={restart} />}
    </div>
  </main>;
}

function Avatar({ phase }) {
  const mode = phase === "speaking" || phase === "opening" ? "speaking" : phase === "listening" ? "listening" : "idle";
  return <div className={`avatar-stage avatar-${mode}`}><div className="avatar-pulse-ring" /><div className="avatar-pulse-ring" /><div className="avatar-core"><span>Z</span></div><p>{mode === "speaking" ? "Zara is speaking" : mode === "listening" ? "Listening to you" : "Answer captured"}</p></div>;
}

function Summary({ answers, events, sharing, tabSwitches, onRestart }) {
  const average = answers.length ? Math.round(answers.reduce((sum, answer) => sum + answer.evaluation.score, 0) / answers.length * 10) / 10 : 0;
  return <div className="mx-auto max-w-3xl space-y-6"><div className="summary-hero"><ScoreRing score={average} size={128} label="avg" /><div><p className="stage-kicker">Complete session</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Interview summary</h1><p className="mt-1 text-sm text-muted-foreground">{answers.length} questions answered across {STAGES.length} stages.</p></div></div>{STAGES.map((stage, stageIndex) => { const stageAnswers = answers.filter(answer => answer.question.stageId === stage.id); return <section key={stage.id} className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="stage-kicker">Stage {stageIndex + 1}</p><h2 className="mt-1 text-xl font-semibold text-foreground">{stage.name}</h2></div><span className="font-mono text-xs text-muted-foreground">{stageAnswers.length}/{stage.questions.length}</span></div><ul className="mt-5 space-y-5">{stageAnswers.map(answer => <li key={answer.question.id} className="border-t border-border pt-4"><div className="flex items-start justify-between gap-4"><p className="text-sm leading-relaxed text-foreground">{answer.question.text}</p><strong className="font-mono text-sm text-primary">{answer.evaluation.score}/10</strong></div><p className="mt-2 rounded-2xl bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">{answer.transcript || "No transcript captured."}</p><p className="mt-2 text-xs text-muted-foreground">{answer.evaluation.verdict}</p></li>)}</ul></section>; })}<section className="rounded-3xl border border-border bg-card p-6"><p className="stage-kicker">Proctoring notes</p><p className="mt-3 text-sm text-muted-foreground">Tab switches recorded: <span className="font-mono text-foreground">{tabSwitches}</span></p><p className="mt-1 text-sm text-muted-foreground">Screen sharing at the end: <span className="font-mono text-foreground">{sharing ? "active" : "not active"}</span></p>{events.length > 0 && <ul className="mt-4 space-y-1">{events.map((event, eventIndex) => <li key={eventIndex} className="font-mono text-[11px] text-muted-foreground">{event.at} — {event.label}</li>)}</ul>}</section><button onClick={onRestart} className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Start another interview</button></div>;
}
