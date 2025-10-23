"use client";

import { useEffect, useMemo, useState } from "react";

type QA = {
  id: number;
  slug: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt?: string;
};

const LAMBDA_URL = process.env.NEXT_PUBLIC_PUBLISH_LAMBDA_URL ?? ""; // set in .env(.local)

export default function QAEditor() {
  // form state
  const [slug, setSlug] = useState("hello-world");
  const [question, setQuestion] = useState("What is this app?");
  const [answer, setAnswer] = useState("A Next.js + Prisma demo with AWS publishing.");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  // list state
  const [items, setItems] = useState<QA[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      !search
        ? items
        : items.filter(
            (r) =>
              r.slug.toLowerCase().includes(search.toLowerCase()) ||
              r.question.toLowerCase().includes(search.toLowerCase())
          ),
    [items, search]
  );

  /* --------------------------- API helpers --------------------------- */

  async function listQA(q?: string) {
    const url = q ? `/api/qa?q=${encodeURIComponent(q)}` : "/api/qa";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    return (await res.json()) as QA[];
  }

  async function createQA() {
    const res = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, question, answer }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(`Save failed${msg ? `: ${msg}` : ""}`);
      return;
    }
    alert("Saved to DB.");
    await refresh();
  }

  async function updateQA(id: number, patch: Partial<Pick<QA, "slug" | "question" | "answer">>) {
    const res = await fetch(`/api/qa/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return alert("Update failed");
    await refresh();
  }

  async function removeQA(id: number) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/qa/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed");
    await refresh();
  }

  async function refresh() {
    setLoadingList(true);
    try {
      const rows = await listQA();
      setItems(rows);
    } catch (e) {
      console.error(e);
      alert("Could not load list.");
    } finally {
      setLoadingList(false);
    }
  }

  /* --------------------------- publishing --------------------------- */

  async function publishToS3() {
    if (!LAMBDA_URL) {
      alert("Missing NEXT_PUBLIC_PUBLISH_LAMBDA_URL");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question, answer }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setPublishedUrl(data.url || "");
      alert("Published!");
    } catch (e: any) {
      alert("Publish failed: " + (e?.message ?? e));
    } finally {
      setPublishing(false);
    }
  }

  /* --------------------------- init --------------------------- */

  useEffect(() => {
    refresh();
  }, []);

  /* --------------------------- UI --------------------------- */

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-2">Q&amp;A Publisher</h1>

      <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
        <label>
          Slug
          <input
            className="input"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="unique-slug"
          />
        </label>

        <label>
          Question
          <textarea
            className="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write the question here…"
          />
        </label>

        <label>
          Answer
          <textarea
            className="textarea"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ height: "10rem" }}
            placeholder="Write the answer here…"
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button className="btn" onClick={createQA}>Save to DB</button>
        <button className="btn" onClick={publishToS3} disabled={publishing}>
          {publishing ? "Publishing..." : "Publish (Lambda → S3)"}
        </button>
        {publishedUrl && (
          <a
            className="btn"
            href={publishedUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
            aria-label="View published page"
          >
            View Published Page →
          </a>
        )}
      </div>

      {/* Recent list */}
      <h2 className="text-xl font-semibold" style={{ marginTop: 24 }}>Recent Q&amp;A</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input
          className="input"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <button className="btn" onClick={refresh} disabled={loadingList}>
          {loadingList ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div
        role="table"
        aria-label="Q and A table"
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          maxWidth: 960,
        }}
      >
        <div
          role="row"
          style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 140px", gap: 8, padding: 10, background: "var(--panel)" }}
        >
          <strong>Slug</strong>
          <strong>Question</strong>
          <strong>Answer</strong>
          <span />
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 12, opacity: 0.7 }}>No items</div>
        )}

        {filtered.map((r) => (
          <div
            key={r.id}
            role="row"
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 140px",
              gap: 8,
              padding: 10,
              borderTop: "1px solid var(--border)",
              alignItems: "start",
            }}
          >
            <input
              className="input"
              defaultValue={r.slug}
              onBlur={(e) => e.target.value !== r.slug && updateQA(r.id, { slug: e.target.value })}
              aria-label={`Slug for ${r.id}`}
            />
            <textarea
              className="input"
              defaultValue={r.question}
              onBlur={(e) => e.target.value !== r.question && updateQA(r.id, { question: e.target.value })}
              aria-label={`Question for ${r.id}`}
              style={{ minHeight: 48 }}
            />
            <textarea
              className="input"
              defaultValue={r.answer}
              onBlur={(e) => e.target.value !== r.answer && updateQA(r.id, { answer: e.target.value })}
              aria-label={`Answer for ${r.id}`}
              style={{ minHeight: 48 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => removeQA(r.id)}>Delete</button>
              <button
                className="btn"
                title="Load into editor"
                onClick={() => {
                  setSlug(r.slug);
                  setQuestion(r.question);
                  setAnswer(r.answer);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit ↑
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
