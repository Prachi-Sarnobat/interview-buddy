import { createFileRoute } from "@tanstack/react-router";
import { InterviewFlow } from "@/components/interview/InterviewFlow";

const title = "AI Interviewer — Voice Mock Interviews";
const description =
  "Practice React, Python, Django and SQL interviews with a voice-driven AI interviewer, live transcription, instant scoring and proctoring.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InterviewFlow,
});
