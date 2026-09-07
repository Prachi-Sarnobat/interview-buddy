import { createFileRoute } from "@tanstack/react-router";
import { InterviewFlow } from "@/components/interview/InterviewFlow";
const title = "Zara — AI Voice Interviewer";
const description = "Practice a full-stack interview across HTML, CSS, React.js, Python, Node.js, PostgreSQL and Django with voice interaction, transcription and proctoring.";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{
      title
    }, {
      name: "description",
      content: description
    }, {
      property: "og:title",
      content: title
    }, {
      property: "og:description",
      content: description
    }]
  }),
  component: InterviewFlow
});
