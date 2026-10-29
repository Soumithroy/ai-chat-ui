import { KeyboardEvent, useEffect, useRef, useState } from "react";

type Props = { onSend: (text: string) => void; onStop: () => void; streaming: boolean };

export function Composer({ onSend, onStop, streaming }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // auto-grow textarea up to ~8 lines
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || streaming) return;
    onSend(t);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder="Message Nova…  (Enter to send, Shift+Enter for a new line)"
        aria-label="Message"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {streaming ? (
        <button className="send stop" onClick={onStop} aria-label="Stop generating">■ Stop</button>
      ) : (
        <button className="send" onClick={submit} disabled={!text.trim()} aria-label="Send">Send ↑</button>
      )}
    </div>
  );
}
