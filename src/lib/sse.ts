/**
 * Parse an OpenAI-style Server-Sent-Events stream into text deltas.
 * Handles events split across network chunks, multiple events per chunk, and the [DONE] sentinel.
 */
export async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const delta = extractDelta(event);
        if (delta === null) return; // [DONE]
        if (delta) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Returns the text delta, "" for non-content events, or null for the [DONE] sentinel. */
export function extractDelta(event: string): string | null {
  let out = "";
  for (const line of event.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") return null;
    try {
      out += JSON.parse(data).choices?.[0]?.delta?.content ?? "";
    } catch {
      /* ignore keep-alives / malformed lines */
    }
  }
  return out;
}
