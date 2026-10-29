import { useState } from "react";
import type { Settings } from "../types";

type Props = { settings: Settings; onSave: (s: Settings) => void; onClose: () => void };

export function SettingsDialog({ settings, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(settings);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="overlay" role="dialog" aria-modal aria-labelledby="settings-title" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title">Settings</h2>

        <label>Provider
          <select value={draft.provider} onChange={(e) => set("provider", e.target.value as Settings["provider"])}>
            <option value="mock">Mock (offline demo)</option>
            <option value="openai-compatible">OpenAI-compatible API</option>
          </select>
        </label>

        {draft.provider === "openai-compatible" && (
          <>
            <label>Base URL
              <input value={draft.baseUrl} onChange={(e) => set("baseUrl", e.target.value)}
                     placeholder="https://api.openai.com/v1 or http://localhost:11434/v1" />
            </label>
            <label>API key
              <input type="password" value={draft.apiKey} onChange={(e) => set("apiKey", e.target.value)}
                     placeholder="Stored only in this browser" />
            </label>
            <p className="hint">For local development only. In production, route calls through a backend so keys never reach the browser.</p>
          </>
        )}

        <label>Model
          <input value={draft.model} onChange={(e) => set("model", e.target.value)} />
        </label>

        <label>System prompt
          <textarea rows={3} value={draft.systemPrompt} onChange={(e) => set("systemPrompt", e.target.value)} />
        </label>

        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => { onSave(draft); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
