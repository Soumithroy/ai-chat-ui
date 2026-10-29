import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { chatReducer } from "./lib/chatReducer";
import { storage } from "./lib/storage";
import { mockProvider } from "./providers/mock";
import { openAICompatibleProvider } from "./providers/openai";
import type { Message, Settings } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

export function useChat(settings: Settings) {
  const [state, dispatch] = useReducer(chatReducer, undefined, () => {
    const conversations = storage.loadConversations();
    return { conversations, activeId: conversations[0]?.id ?? null };
  });
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persist (debounced) so streaming doesn't hammer localStorage on every token
  useEffect(() => {
    const t = setTimeout(() => storage.saveConversations(state.conversations), 300);
    return () => clearTimeout(t);
  }, [state.conversations]);

  const active = state.conversations.find((c) => c.id === state.activeId) ?? null;

  const run = useCallback(
    async (convId: string, history: Message[]) => {
      const provider = settings.provider === "mock" ? mockProvider : openAICompatibleProvider;
      const assistantId = uid();
      dispatch({ type: "addMessage", convId, message: { id: assistantId, role: "assistant", content: "" } });

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      try {
        const payload = [
          { role: "system" as const, content: settings.systemPrompt },
          ...history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
        ];
        for await (const delta of provider.stream(payload, settings, controller.signal)) {
          dispatch({ type: "appendDelta", convId, messageId: assistantId, delta });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          dispatch({ type: "markError", convId, messageId: assistantId, error: (e as Error).message });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [settings],
  );

  const send = useCallback(
    (text: string) => {
      let convId = state.activeId;
      if (!convId) {
        convId = uid();
        dispatch({ type: "new", id: convId, model: settings.model });
      }
      const userMsg: Message = { id: uid(), role: "user", content: text };
      dispatch({ type: "addMessage", convId, message: userMsg });
      const prior = state.conversations.find((c) => c.id === convId)?.messages ?? [];
      run(convId, [...prior, userMsg]);
    },
    [state, settings.model, run],
  );

  const regenerate = useCallback(() => {
    if (!active || streaming) return;
    const lastAssistant = [...active.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    const history = active.messages.slice(0, active.messages.indexOf(lastAssistant));
    dispatch({ type: "truncateFrom", convId: active.id, messageId: lastAssistant.id });
    run(active.id, history);
  }, [active, streaming, run]);

  return {
    conversations: state.conversations,
    active,
    streaming,
    send,
    regenerate,
    stop: () => abortRef.current?.abort(),
    newChat: () => dispatch({ type: "new", id: uid(), model: settings.model }),
    select: (id: string) => dispatch({ type: "select", id }),
    remove: (id: string) => dispatch({ type: "delete", id }),
  };
}
