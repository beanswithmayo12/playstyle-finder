/**
 * The 14-screen questionnaire (docs/05-monetization-ux.md).
 * Screens 1–3 build the athlete profile; screens 4–14 feed the AI scorer.
 * Option labels are self-describing sentences — they're sent verbatim to the
 * questionnaire analyst prompt, so the label IS the signal. GK phrasing
 * variants keep the same metric coverage for keepers.
 */

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  kind: "single" | "text";
  prompt: string;
  gkPrompt?: string; // shown instead when position === "GK"
  options?: string[];
  gkOptions?: string[];
  placeholder?: string;
}

export const POSITION_OPTIONS: QuizOption[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "CB", label: "Center back" },
  { value: "FB", label: "Fullback / wingback" },
  { value: "DM", label: "Defensive midfielder" },
  { value: "CM", label: "Central midfielder" },
  { value: "AM", label: "Attacking midfielder" },
  { value: "W", label: "Winger" },
  { value: "ST", label: "Striker" },
];

export const FOOT_OPTIONS: QuizOption[] = [
  { value: "RIGHT", label: "Right" },
  { value: "LEFT", label: "Left" },
  { value: "BOTH", label: "Both — genuinely two-footed" },
];

export const LEVEL_OPTIONS: QuizOption[] = [
  { value: "YOUTH", label: "Youth club" },
  { value: "HIGH_SCHOOL", label: "High school" },
  { value: "ACADEMY", label: "Academy" },
  { value: "COLLEGE", label: "College" },
  { value: "SEMI_PRO", label: "Semi-pro" },
  { value: "ADULT_AMATEUR", label: "Adult amateur" },
];

export const TACTICAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "under-pressure",
    kind: "single",
    prompt: "You receive the ball and an opponent is closing you down fast. What's your first instinct?",
    gkPrompt: "The ball is played back to you and a striker is charging in. What's your first instinct?",
    options: [
      "Shield it, stay calm, and recycle possession safely",
      "Take them on — pressure is an invitation to dribble",
      "Play forward immediately, even if it's risky",
      "One-touch it to a teammate and move into space",
    ],
    gkOptions: [
      "Take a touch, look up, and pick a calm short pass",
      "Beat the presser with a touch around them",
      "Hit it long early toward our forwards",
      "One-touch clear to safety, no risks",
    ],
  },
  {
    id: "attacking-movement",
    kind: "single",
    prompt: "When your team has the ball and you don't, where are you?",
    gkPrompt: "When your team has the ball in the opponent's half, where are you?",
    options: [
      "Sprinting into space behind the last defender",
      "Drifting into pockets between the opponent's lines",
      "Staying wide to stretch the pitch",
      "Holding my position so we're safe if we lose it",
    ],
    gkOptions: [
      "High outside my box, acting as a spare defender",
      "On the edge of my box, ready to sweep",
      "Talking constantly, organizing the back line",
      "On my line, focused on my goal",
    ],
  },
  {
    id: "shooting",
    kind: "single",
    prompt: "A shooting chance opens up at the edge of the box. What happens?",
    gkPrompt: "How do you feel about joining attacks for late corners or free kicks?",
    options: [
      "I shoot. Every time. No hesitation",
      "I shoot if it's clearly the best option",
      "I usually look for a better-placed teammate",
      "I'm rarely in that position — it's not my game",
    ],
    gkOptions: [
      "Love it — I'm up there if we need a goal",
      "Only in desperate moments",
      "I stay back — that's not my job",
      "My coach would never allow it",
    ],
  },
  {
    id: "passing-style",
    kind: "single",
    prompt: "What's your favorite pass to play?",
    options: [
      "Quick one-twos and short combinations",
      "The threaded through-ball that splits the defense",
      "The big switch of play to the far side",
      "The simple, safe pass — keep it moving",
    ],
  },
  {
    id: "tempo",
    kind: "single",
    prompt: "How do you affect the rhythm of a game?",
    options: [
      "I deliberately slow it down and take control",
      "I inject speed — I want the game frantic",
      "I read what the team needs and adapt",
      "Honestly, I don't think about tempo",
    ],
  },
  {
    id: "pressing",
    kind: "single",
    prompt: "Your team just lost the ball. What do you do in the next three seconds?",
    options: [
      "Sprint at the ball-carrier to win it back immediately",
      "Press if they're close, otherwise recover",
      "Drop into defensive shape first",
      "Stay high — I'm the out-ball for the counter",
    ],
  },
  {
    id: "duels",
    kind: "single",
    prompt: "50/50 balls, shoulder battles, aerial duels — how do you feel about them?",
    options: [
      "I live for them. Physical battles are my game",
      "I take them on when needed and win my share",
      "I'd rather win with brains and skill than body",
      "I actively avoid them — not my strength",
    ],
  },
  {
    id: "athleticism",
    kind: "single",
    prompt: "What's your athletic superpower?",
    options: [
      "Explosive first step — I create separation instantly",
      "Engine — I run hard for 90 minutes without dropping off",
      "Strength — I'm hard to knock off the ball",
      "Agility and balance — quick feet, sharp turns",
    ],
  },
  {
    id: "scanning",
    kind: "single",
    prompt: "Before a pass arrives, how often do you check over your shoulder?",
    options: [
      "Constantly — I always know what's around me",
      "Usually, especially in tight areas",
      "Sometimes, when I remember",
      "Rarely — I figure it out after my first touch",
    ],
  },
  {
    id: "strengths",
    kind: "text",
    prompt: "Describe your two biggest strengths as a player — with a real example of each from a recent game.",
    placeholder: "e.g. My vision — last week I spotted our winger's run and hit a 30-yard ball over the top for a goal...",
  },
  {
    id: "weaknesses",
    kind: "text",
    prompt: "Be honest: what does your coach keep telling you to improve?",
    placeholder: "e.g. He says I drift out of games defensively and need to shoot more instead of always passing...",
  },
];

/** 3 profile screens + 11 tactical questions = 14 total. */
export const TOTAL_SCREENS = 3 + TACTICAL_QUESTIONS.length;

export interface QuizAnswers {
  positionGroup: string;
  preferredFoot: string;
  playingLevel: string;
  tactical: { id: string; question: string; answer: string }[];
}

export const QUIZ_STORAGE_KEY = "playstyle-quiz-answers";
