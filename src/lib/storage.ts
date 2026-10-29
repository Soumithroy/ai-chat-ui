import type { Conversation, Settings } from "../types";

const CONV_KEY = "nova.conversations.v1";
const SETTINGS_KEY = "nova.settings.v1";

export const defaultSettings: Settings = {
  provider: "mock",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  systemPrompt: "You are a helpful, concise assistant. Use markdown when it helps.",
  theme: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled – app still works in memory */
  }
}

export const storage = {
  loadConversations: (): Conversation[] => {
    try {
      return JSON.parse(localStorage.getItem(CONV_KEY) ?? "[]");
    } catch {
      return [];
    }
  },
  saveConversations: (c: Conversation[]) => write(CONV_KEY, c),
  loadSettings: () => read<Settings>(SETTINGS_KEY, defaultSettings),
  saveSettings: (s: Settings) => write(SETTINGS_KEY, s),
};
