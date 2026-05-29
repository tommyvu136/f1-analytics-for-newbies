"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface AiPanelProps {
  title: string;
  onExplain: () => Promise<{ explanation: string; cached: boolean }>;
}

export default function AiPanel({ title, onExplain }: AiPanelProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  async function handleExplain() {
    setLoading(true);
    setError(null);
    try {
      const result = await onExplain();
      setText(result.explanation);
      setCached(result.cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI explanation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card border-f1-red/30">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-f1-red">{title}</h3>
        <button className="btn-primary text-xs" onClick={handleExplain} disabled={loading}>
          {loading ? "Thinking..." : "Explain with AI"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {text && (
        <div>
          {cached && <p className="mb-1 text-xs text-f1-muted">Cached response</p>}
          <p className="text-sm leading-relaxed text-gray-200">{text}</p>
        </div>
      )}
      {!text && !error && (
        <p className="text-sm text-f1-muted">
          Click the button to get a beginner-friendly explanation powered by Groq AI.
        </p>
      )}
    </div>
  );
}

interface AskBoxProps {
  className?: string;
}

export function AskBox({ className }: AskBoxProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.explainAsk(question);
      setAnswer(result.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card ${className ?? ""}`}>
      <h3 className="mb-3 font-semibold">Ask F1 AI</h3>
      <form onSubmit={handleAsk} className="flex flex-col gap-3">
        <input
          className="select-input w-full"
          placeholder="e.g. What is an undercut?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn-primary w-fit" disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {answer && <p className="mt-3 text-sm leading-relaxed text-gray-200">{answer}</p>}
    </div>
  );
}
