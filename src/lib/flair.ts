/**
 * Motion and interaction extras ("flair"). Each switch is one numbered option
 * from the motion preview. Set one to false to turn that effect off
 * everywhere; nothing else needs to change. Everything here also stands down
 * for visitors with "reduce motion" turned on.
 */
export const FLAIR = {
  /** 1 · Ratings and match % count up, then the match block stamps in. */
  scoreboardKickoff: true,
  /** 2 · Head-to-head bars race out; hovering a row shows the gap. */
  racingBars: true,
  /** 3 · Heat map toggle: You / your pro / Both, with an overlap score. */
  proHeatMap: true,
  /** 4 · Hover a pitch zone to see how much time you spend there. */
  zoneHover: true,
  /** 5 · Hovering a tendency draws the move on the pitch. */
  tendencyMoves: true,
  /** 6 · Film timeline with a tick per tagged moment and a live playhead. */
  filmScrubber: true,
  /** 7 · Cards lift onto a hard shadow, buttons press down, arrows nudge. */
  cardFeel: true,
  /** 8 · Light/dark switch spreads out in a circle from the toggle. */
  floodlightTheme: true,
  /** 9 · Sign-up step shows a blurred, locked report next to the form. */
  lockedTeaser: true,
  /** 10 · The pro's name shuffles through the roster, then lands on your match. */
  proShuffle: true,
  /** 11 · Sign-up and sign-in forms restyled to match the site. */
  styledAuthForms: true,
  /** 12 · Quiz ✓ → Account → Your report progress steps on sign-up. */
  progressSteps: true,
  /** 13 · Faint pitch markings draw themselves behind the sign-up screen. */
  pitchLines: true,
  /** 14 · "Welcome back" sign-in popup that rises in over a blurred page. */
  signInPopup: true,
} as const;

/**
 * The switches written onto <html data-flair="…">, so stylesheet rules can
 * opt in with :root[data-flair~="name"].
 */
export function flairAttr(): string {
  return (Object.keys(FLAIR) as (keyof typeof FLAIR)[]).filter((k) => FLAIR[k]).join(" ");
}
