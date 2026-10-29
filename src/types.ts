export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  updatedAt: number;
}

export interface Settings {
  provider: "mock" | "openai-compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  theme: "light" | "dark";
}

/** A provider streams text deltas for a conversation and must honour the abort signal. */
export interface ChatProvider {
  stream(
    messages: { role: Role | "system"; content: string }[],
    settings: Settings,
    signal: AbortSignal,
  ): AsyncGenerator<string>;
}
