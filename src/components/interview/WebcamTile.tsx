import { useEffect, useRef, useState } from "react";

export function WebcamTile() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => {});
        }
        setLive(true);
      })
      .catch(() => setError("Camera unavailable — check browser permissions."));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center font-mono text-[11px] text-muted-foreground">
            {error}
          </div>
        )}
        {live && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" />
            Live
          </span>
        )}
      </div>
      <p className="mt-3 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Candidate preview
      </p>
    </div>
  );
}
