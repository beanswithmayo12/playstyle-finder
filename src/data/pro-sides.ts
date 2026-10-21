import type { Side } from "@/lib/heatmap";

/**
 * The flank each wide pro mostly plays on, keyed by pro slug. Drives the
 * pro's layer on the heat map; pros in central roles aren't listed.
 */
export const PRO_SIDES: Record<string, Side> = {
  // Wingers
  "vinicius-junior": "LEFT",
  "lamine-yamal": "RIGHT",
  "mohamed-salah": "RIGHT",
  "jeremy-doku": "LEFT",
  "khvicha-kvaratskhelia": "LEFT",
  "bukayo-saka": "RIGHT",
  // Fullbacks
  "achraf-hakimi": "RIGHT",
  "trent-alexander-arnold": "RIGHT",
  "alphonso-davies": "LEFT",
  "aaron-wan-bissaka": "RIGHT",
};
