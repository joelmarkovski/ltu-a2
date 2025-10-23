"use client";
import { useState } from "react";

const LAMBDA_URL = process.env.NEXT_PUBLIC_PUBLISH_LAMBDA_URL ?? ""; // set in .env.local when ready

export default function QAEditor() {
  const [slug, setSlug] = useState("hello-world");
  const [question, setQuestion] = useState("What is this app?");
  const [answer, setAnswer] = useState("A Next.js + Prisma demo with AWS publishing.");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  async function saveQA() {
    const res = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, question, answer })
    });
    if (!res.ok) return alert("Save failed");
    alert("Saved to DB.");
  }

  async function publishToS3() {
    if (!LAMBDA_URL) { alert("Missing NEXT_PUBLIC_PUBLISH_LAMBDA_URL"); return; }
    setPublishing(true);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question, answer })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setPublishedUrl(data.url || "");
      alert("Published!");
    } catch (e:any) {
      alert("Publish failed: " + (e?.message ?? e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-2">Q&A Publisher</h1>
      <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <label>Slug
          <input className="input" value={slug} onChange={e=>setSlug(e.target.value.replace(/\s+/g,"-").toLowerCase())} />
        </label>
        <label>Question
          <textarea className="textarea" value={question} onChange={e=>setQuestion(e.target.value)} />
        </label>
        <label>Answer
          <textarea className="textarea" value={answer} onChange={e=>setAnswer(e.target.value)} style={{ height: "10rem" }} />
        </label>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
        <button className="btn" onClick={saveQA}>Save to DB</button>
        <button className="btn" onClick={publishToS3} disabled={publishing}>
          {publishing ? "Publishing..." : "Publish (Lambda → S3)"}
        </button>
        {publishedUrl && (
          <a className="btn" href={publishedUrl} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            View Published Page →
          </a>
        )}
      </div>
    </section>
  );
}
