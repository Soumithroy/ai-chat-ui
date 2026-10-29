import { useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { MessageView } from "./components/MessageView";
import { SettingsDialog } from "./components/SettingsDialog";
import { useChat } from "./hooks";
import { storage } from "./lib/storage";
import type { Settings } from "./types";

const SUGGESTIONS = [
  "Write a Python function for Fibonacci",
  "Compare RAG vs fine-tuning in a table",
  "Explain how streaming responses work",
];

export default function App() {
  const [settings, setSettings] = useState<Settings>(storage.loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chat = useChat(settings);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    storage.saveSettings(settings);
  }, [settings]);

  // Auto-scroll while streaming, unless the user scrolled up to read
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.active?.messages]);

  const messages = chat.active?.messages ?? [];
  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className={`app ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside className="sidebar">
        <button className="new-chat" onClick={() => { chat.newChat(); setSidebarOpen(false); }}>+ New chat</button>
        <nav aria-label="Conversations">
          {chat.conversations.map((c) => (
            <div key={c.id} className={`conv ${c.id === chat.active?.id ? "active" : ""}`}>
              <button className="conv-title" onClick={() => { chat.select(c.id); setSidebarOpen(false); }}>{c.title}</button>
              <button className="icon-btn" aria-label={`Delete ${c.title}`} onClick={() => chat.remove(c.id)}>✕</button>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))}>
            {settings.theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
          <button onClick={() => setShowSettings(true)}>⚙ Settings</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu icon-btn" aria-label="Toggle sidebar" onClick={() => setSidebarOpen((o) => !o)}>☰</button>
          <span className="brand">Nova Chat</span>
          <span className="badge">{settings.provider === "mock" ? "mock" : settings.model}</span>
        </header>

        <div className="scroll" ref={scrollRef}
             onScroll={(e) => {
               const el = e.currentTarget;
               stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
             }}>
          {messages.length === 0 ? (
            <div className="welcome">
              <h1>How can I help today?</h1>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => chat.send(s)}>{s}</button>)}
              </div>
            </div>
          ) : (
            <div className="thread">
              {messages.map((m) => (
                <MessageView key={m.id} message={m} streaming={chat.streaming && m.id === lastId} />
              ))}
              {!chat.streaming && messages.at(-1)?.role === "assistant" && (
                <button className="regen" onClick={chat.regenerate}>↻ Regenerate</button>
              )}
            </div>
          )}
        </div>

        <Composer onSend={chat.send} onStop={chat.stop} streaming={chat.streaming} />
      </main>

      {showSettings && <SettingsDialog settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
