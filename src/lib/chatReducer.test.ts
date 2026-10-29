import { describe, expect, it } from "vitest";
import { chatReducer, type ChatState } from "./chatReducer";

const empty: ChatState = { conversations: [], activeId: null };

describe("chatReducer", () => {
  it("creates a conversation and titles it from the first user message", () => {
    let s = chatReducer(empty, { type: "new", id: "c1", model: "m" });
    s = chatReducer(s, { type: "addMessage", convId: "c1", message: { id: "u1", role: "user", content: "Explain RAG" } });
    expect(s.activeId).toBe("c1");
    expect(s.conversations[0].title).toBe("Explain RAG");
  });

  it("appends streamed deltas to the right message", () => {
    let s = chatReducer(empty, { type: "new", id: "c1", model: "m" });
    s = chatReducer(s, { type: "addMessage", convId: "c1", message: { id: "a1", role: "assistant", content: "" } });
    for (const d of ["Hel", "lo"]) s = chatReducer(s, { type: "appendDelta", convId: "c1", messageId: "a1", delta: d });
    expect(s.conversations[0].messages[0].content).toBe("Hello");
  });

  it("truncates from a message (used by regenerate) and selects another chat on delete", () => {
    let s = chatReducer(empty, { type: "new", id: "c1", model: "m" });
    s = chatReducer(s, { type: "new", id: "c2", model: "m" });
    s = chatReducer(s, { type: "addMessage", convId: "c2", message: { id: "u1", role: "user", content: "q" } });
    s = chatReducer(s, { type: "addMessage", convId: "c2", message: { id: "a1", role: "assistant", content: "x" } });
    s = chatReducer(s, { type: "truncateFrom", convId: "c2", messageId: "a1" });
    expect(s.conversations[0].messages).toHaveLength(1);
    s = chatReducer(s, { type: "delete", id: "c2" });
    expect(s.activeId).toBe("c1");
  });
});
