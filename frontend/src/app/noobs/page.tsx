"use client";

import { useEffect, useState } from "react";
import { AskBox } from "@/components/AiPanel";
import { api } from "@/lib/api";
import type { GlossaryTerm } from "@/types";

export default function NoobsPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getGlossary()
      .then((g) => setTerms(g.terms))
      .finally(() => setLoading(false));
  }, []);

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="mb-2 text-2xl font-bold">F1 for Noobs</h1>
        <p className="text-f1-muted">
          New to Formula 1? Start here. Browse common terms below or ask our AI anything
          you don&apos;t understand.
        </p>
      </section>

      <AskBox />

      <div>
        <input
          className="select-input mb-4 w-full max-w-md"
          placeholder="Search glossary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-f1-muted">Loading glossary...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((term) => (
              <div key={term.term} className="card">
                <h3 className="mb-2 font-bold text-f1-red">{term.term}</h3>
                <p className="text-sm leading-relaxed text-gray-200">{term.definition}</p>
                {term.example && (
                  <p className="mt-2 text-xs italic text-f1-muted">Example: {term.example}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
