import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "playstyle-finder" });

/** Payload for "video/analysis.requested" (Inngest v4 leaves data untyped). */
export interface VideoAnalysisRequested {
  assessmentId: string;
  userId: string;
  videoKey: string;
  positionGroup: string;
  jerseyColor: string;
  jerseyNumber: string;
}
