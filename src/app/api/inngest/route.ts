import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { analyzeVideo } from "@/inngest/analyze-video";

// Local dev: run `npx inngest-cli@latest dev` alongside `npm run dev`.
export const maxDuration = 300; // video analysis needs the long lane

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeVideo],
});
