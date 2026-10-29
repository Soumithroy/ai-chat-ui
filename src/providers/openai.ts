import { parseSSE } from "../lib/sse";
import type { ChatProvider } from "../types";

/** Works with any OpenAI-compatible /chat/completions endpoint (OpenAI, Ollama, vLLM, LM Studio, a proxy…). */
export const openAICompatibleProvider: ChatProvider = {
  async *stream(messages, settings, signal) {
    const res = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: settings.model, messages, stream: true }),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200) || res.statusText}`);
    }
    yield* parseSSE(res.body);
  },
};
