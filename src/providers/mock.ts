import type { ChatProvider } from "../types";

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

function reply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("code") || p.includes("python") || p.includes("function")) {
    return [
      "Here's a small example:\n",
      "```python",
      "def fibonacci(n: int) -> list[int]:",
      "    seq = [0, 1]",
      "    while len(seq) < n:",
      "        seq.append(seq[-1] + seq[-2])",
      "    return seq[:n]",
      "```",
      "\nIt runs in **O(n)** time. Want a recursive version too?",
    ].join("\n");
  }
  if (p.includes("table") || p.includes("compare")) {
    return "| Approach | Latency | Cost |\n|---|---|---|\n| RAG | Low | $ |\n| Fine-tuning | Low | $$$ |\n| Long context | Higher | $$ |\n\nRAG is usually the best starting point.";
  }
  return (
    `You said: *"${prompt.slice(0, 120)}"*.\n\nThis is the **mock provider**, streaming tokens locally so the UI ` +
    "can be demoed without an API key. Open **Settings** to connect any OpenAI-compatible endpoint.\n\n" +
    "Try asking for *code* or a *comparison table* to see markdown rendering."
  );
}

/** Streams a canned answer word-by-word to exercise the same code path as a real model. */
export const mockProvider: ChatProvider = {
  async *stream(messages, _settings, signal) {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    for (const token of reply(last).split(/(\s+)/)) {
      await sleep(18, signal);
      yield token;
    }
  },
};
