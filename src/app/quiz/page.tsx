"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FOOT_OPTIONS,
  LEVEL_OPTIONS,
  POSITION_OPTIONS,
  QUIZ_STORAGE_KEY,
  TACTICAL_QUESTIONS,
  TOTAL_SCREENS,
  type QuizAnswers,
} from "@/data/quiz";

// The free-analysis funnel: one question per screen, no auth wall.
// Answers live in sessionStorage until the reveal step (docs/05).
export default function QuizPage() {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({ tactical: [] });
  const [textDraft, setTextDraft] = useState("");

  const isGk = answers.positionGroup === "GK";
  const tacticalIndex = screen - 3;
  const question = tacticalIndex >= 0 ? TACTICAL_QUESTIONS[tacticalIndex] : null;

  const progress = Math.round((screen / TOTAL_SCREENS) * 100);

  const finish = useCallback(
    (final: QuizAnswers) => {
      sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(final));
      router.push("/quiz/reveal");
    },
    [router],
  );

  const advance = useCallback(
    (updated: Partial<QuizAnswers>) => {
      setTextDraft("");
      if (screen + 1 >= TOTAL_SCREENS) {
        finish(updated as QuizAnswers);
      } else {
        setAnswers(updated);
        setScreen((s) => s + 1);
      }
    },
    [screen, finish],
  );

  const answerTactical = useCallback(
    (answer: string) => {
      if (!question) return;
      const prompt = isGk && question.gkPrompt ? question.gkPrompt : question.prompt;
      const tactical = [
        ...(answers.tactical ?? []).filter((t) => t.id !== question.id),
        { id: question.id, question: prompt, answer },
      ];
      advance({ ...answers, tactical });
    },
    [question, isGk, answers, advance],
  );

  const { prompt, options, isText, placeholder } = useMemo(() => {
    if (screen === 0)
      return { prompt: "Where do you play most often?", options: POSITION_OPTIONS.map((o) => o.label), isText: false, placeholder: "" };
    if (screen === 1)
      return { prompt: "What's your stronger foot?", options: FOOT_OPTIONS.map((o) => o.label), isText: false, placeholder: "" };
    if (screen === 2)
      return { prompt: "What level do you currently play at?", options: LEVEL_OPTIONS.map((o) => o.label), isText: false, placeholder: "" };
    const q = question!;
    return {
      prompt: isGk && q.gkPrompt ? q.gkPrompt : q.prompt,
      options: (isGk && q.gkOptions ? q.gkOptions : q.options) ?? [],
      isText: q.kind === "text",
      placeholder: q.placeholder ?? "",
    };
  }, [screen, question, isGk]);

  function selectOption(label: string) {
    if (screen === 0) {
      advance({ ...answers, positionGroup: POSITION_OPTIONS.find((o) => o.label === label)!.value });
    } else if (screen === 1) {
      advance({ ...answers, preferredFoot: FOOT_OPTIONS.find((o) => o.label === label)!.value });
    } else if (screen === 2) {
      advance({ ...answers, playingLevel: LEVEL_OPTIONS.find((o) => o.label === label)!.value });
    } else {
      answerTactical(label);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-1 bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12">
        <p className="mb-2 text-sm text-zinc-500">
          Question {screen + 1} of {TOTAL_SCREENS}
        </p>
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">{prompt}</h1>

        {isText ? (
          <div className="flex flex-col gap-4">
            <textarea
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              placeholder={placeholder}
              rows={5}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={() => textDraft.trim().length >= 10 && answerTactical(textDraft.trim())}
              disabled={textDraft.trim().length < 10}
              className="self-end rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
            >
              {screen + 1 === TOTAL_SCREENS ? "Get my analysis" : "Continue"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {options.map((label) => (
              <button
                key={label}
                onClick={() => selectOption(label)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-4 text-left text-zinc-100 transition hover:border-emerald-500 hover:bg-zinc-800"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {screen > 0 && (
          <button
            onClick={() => setScreen((s) => s - 1)}
            className="mt-8 self-start text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            ← Back
          </button>
        )}
      </div>
    </main>
  );
}
