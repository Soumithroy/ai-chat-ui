import { describe, expect, it } from "vitest";
import { extractDelta, parseSSE } from "./sse";

const enc = new TextEncoder();
const ev = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

function streamOf(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((x) => c.enqueue(enc.encode(x)));
      c.close();
    },
  });
}

async function collect(gen: AsyncGenerator<string>) {
  let s = "";
  for await (const d of gen) s += d;
  return s;
}

describe("SSE parsing", () => {
  it("extracts a delta and detects DONE", () => {
    expect(extractDelta(ev("hi").trim())).toBe("hi");
    expect(extractDelta("data: [DONE]")).toBeNull();
    expect(extractDelta(": keep-alive")).toBe("");
  });

  it("handles events split across network chunks", async () => {
    const full = ev("Hello") + ev(", ") + ev("world") + "data: [DONE]\n\n";
    const chunks = [full.slice(0, 7), full.slice(7, 50), full.slice(50)];
    expect(await collect(parseSSE(streamOf(chunks)))).toBe("Hello, world");
  });

  it("stops at [DONE] even if more data follows", async () => {
    expect(await collect(parseSSE(streamOf([ev("a") + "data: [DONE]\n\n" + ev("b")])))).toBe("a");
  });
});
