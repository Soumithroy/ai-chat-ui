import type { Conversation, Message } from "../types";

export type ChatState = { conversations: Conversation[]; activeId: string | null };

export type Action =
  | { type: "new"; id: string; model: string }
  | { type: "select"; id: string }
  | { type: "delete"; id: string }
  | { type: "rename"; id: string; title: string }
  | { type: "addMessage"; convId: string; message: Message }
  | { type: "appendDelta"; convId: string; messageId: string; delta: string }
  | { type: "markError"; convId: string; messageId: string; error: string }
  | { type: "truncateFrom"; convId: string; messageId: string };

const titleFrom = (text: string) => (text.length > 40 ? text.slice(0, 40).trim() + "…" : text);

function updateConv(state: ChatState, id: string, fn: (c: Conversation) => Conversation): ChatState {
  return {
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)),
  };
}

/** Pure reducer – all chat state transitions live here, which keeps them unit-testable. */
export function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "new": {
      const conv: Conversation = { id: action.id, title: "New chat", model: action.model, messages: [], updatedAt: Date.now() };
      return { conversations: [conv, ...state.conversations], activeId: conv.id };
    }
    case "select":
      return { ...state, activeId: action.id };
    case "delete": {
      const conversations = state.conversations.filter((c) => c.id !== action.id);
      const activeId = state.activeId === action.id ? (conversations[0]?.id ?? null) : state.activeId;
      return { conversations, activeId };
    }
    case "rename":
      return updateConv(state, action.id, (c) => ({ ...c, title: action.title }));
    case "addMessage":
      return updateConv(state, action.convId, (c) => ({
        ...c,
        title: c.messages.length === 0 && action.message.role === "user" ? titleFrom(action.message.content) : c.title,
        messages: [...c.messages, action.message],
      }));
    case "appendDelta":
      return updateConv(state, action.convId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === action.messageId ? { ...m, content: m.content + action.delta } : m)),
      }));
    case "markError":
      return updateConv(state, action.convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === action.messageId ? { ...m, error: true, content: m.content || `⚠️ ${action.error}` } : m,
        ),
      }));
    case "truncateFrom":
      return updateConv(state, action.convId, (c) => {
        const idx = c.messages.findIndex((m) => m.id === action.messageId);
        return idx === -1 ? c : { ...c, messages: c.messages.slice(0, idx) };
      });
  }
}
