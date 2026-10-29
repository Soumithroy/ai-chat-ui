import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-btn"
      aria-label="Copy message"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export const MessageView = memo(function MessageView({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={`message ${message.role} ${message.error ? "error" : ""}`}>
      <div className="avatar" aria-hidden>{isUser ? "You" : "AI"}</div>
      <div className="content">
        {isUser ? (
          <p className="plain">{message.content}</p>
        ) : (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || " "}</ReactMarkdown>
            {streaming && <span className="cursor" aria-hidden />}
          </div>
        )}
        {!isUser && !streaming && message.content && (
          <div className="actions">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
});
