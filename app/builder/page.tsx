"use client";
import { useEffect, useMemo, useState } from "react";

type Question = { id: number; slug: string; question: string; answer: string };
type StageDraft = { questionId: number; timerSecs?: number; hint?: string };

// 🔧 Preselected backdrops (replace these paths with your actual files)
const PRESET_BACKDROPS = [
  "/escape-bg-1.jpg",
  "/escape-bg-2.jpg",
  "/escape-bg-3.jpg",
] as const;

export default function BuilderPage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("My Escape Game");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);

  // 🖼️ Single-choice backdrop
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_BACKDROPS[0]);

  async function loadQuestions() {
    const res = await fetch("/api/qa");
    const data = await res.json();
    setQuestions(data);
  }

  useEffect(() => {
    loadQuestions().finally(() => setLoading(false));
  }, []);

  const available = useMemo(() => {
    const used = new Set(stages.map((s) => s.questionId));
    return questions.filter((q) => !used.has(q.id));
  }, [questions, stages]);

  function addStage(qid: number) {
    setStages((prev) => [...prev, { questionId: qid, timerSecs: 60 }]);
  }
  function removeStage(idx: number) {
    setStages((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveStage(idx: number, dir: -1 | 1) {
    setStages((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }
  function updateStage(idx: number, patch: Partial<StageDraft>) {
    setStages((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        images: [selectedImage], // ✅ persist single selected backdrop
        stages: stages.map((s, i) => ({
          questionId: s.questionId,
          orderIndex: i,
          timerSecs: s.timerSecs ?? null,
          hint: s.hint ?? null,
        })),
      };
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      setGameId(created.id);
      alert("Game saved!");
    } catch (e: any) {
      alert("Save failed: " + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function update() {
    if (!gameId) return;
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        images: [selectedImage], // ✅ include on update too
        stages: stages.map((s, i) => ({
          questionId: s.questionId,
          orderIndex: i,
          timerSecs: s.timerSecs ?? null,
          hint: s.hint ?? null,
        })),
      };
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      await res.json();
      alert("Game updated!");
    } catch (e: any) {
      alert("Update failed: " + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <main className="container" style={{ padding: "2rem", maxWidth: 1000 }}>
      <h1>Escape Room Builder</h1>

      <section style={{ display: "grid", gap: 16, margin: "16px 0" }}>
        <label>
          <div className="label">Title</div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          <div className="label">Description</div>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </section>

      {/* 🖼️ Backdrop selector (single-choice, 3 presets) */}
      <section style={{ margin: "8px 0 24px" }}>
        <h2>Backdrop</h2>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
          Choose one of the preset backgrounds for your escape room.
        </p>
        <div
          role="listbox"
          aria-label="Choose backdrop"
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          {PRESET_BACKDROPS.map((url) => {
            const active = selectedImage === url;
            return (
              <button
                key={url}
                role="option"
                aria-selected={active}
                onClick={() => setSelectedImage(url)}
                className="btn"
                style={{
                  padding: 0,
                  borderRadius: 10,
                  outline: active ? "2px solid dodgerblue" : "1px solid #ccc",
                  overflow: "hidden",
                  boxShadow: active ? "0 0 0 3px rgba(30,144,255,0.25)" : "none",
                }}
                title={active ? "Selected backdrop" : "Choose this backdrop"}
              >
                <img
                  src={url}
                  alt=""
                  width={200}
                  height={120}
                  style={{ display: "block", objectFit: "cover", width: 200, height: 120 }}
                />
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          Selected: <code>{selectedImage}</code>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section>
          <h2>Available Questions</h2>
          <ul style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 200 }}>
            {available.map((q) => (
              <li key={q.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 6 }}>
                <code>{q.slug}</code>
                <span
                  style={{
                    flex: 1,
                    opacity: 0.8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.question}
                </span>
                <button className="btn" onClick={() => addStage(q.id)} data-testid={`add-stage-${q.id}`}>
                  Add
                </button>
              </li>
            ))}
            {available.length === 0 && <li style={{ opacity: 0.6 }}>All questions are used.</li>}
          </ul>
        </section>

        <section>
          <h2>Stages (in order)</h2>
          <ol style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 200 }}>
            {stages.map((s, i) => {
              const q = questions.find((q) => q.id === s.questionId);
              return (
                <li
                  key={`${s.questionId}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, marginBottom: 12 }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn" onClick={() => moveStage(i, -1)} aria-label="move up">
                      ↑
                    </button>
                    <button className="btn" onClick={() => moveStage(i, +1)} aria-label="move down">
                      ↓
                    </button>
                  </div>
                  <div>
                    <div>
                      <strong>{q?.slug}</strong> — {q?.question}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <label>
                        <small>Timer (secs)</small>
                        <br />
                        <input
                          type="number"
                          className="input"
                          style={{ width: 100 }}
                          value={s.timerSecs ?? 60}
                          onChange={(e) => updateStage(i, { timerSecs: Number(e.target.value) })}
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        <small>Hint</small>
                        <br />
                        <input
                          className="input"
                          value={s.hint ?? ""}
                          onChange={(e) => updateStage(i, { hint: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <button className="btn" onClick={() => removeStage(i)} aria-label="remove stage">
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
            {stages.length === 0 && <li style={{ opacity: 0.6 }}>No stages yet — click “Add” on a question.</li>}
          </ol>
        </section>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {!gameId ? (
          <button
            className="btn"
            disabled={saving || stages.length === 0 || !selectedImage}
            onClick={save}
            data-testid="save-game"
          >
            Save Game
          </button>
        ) : (
          <>
            <button className="btn" disabled={saving} onClick={update} data-testid="update-game">
              Update
            </button>
            <a className="btn" href={`/play/${gameId}`} data-testid="play-link">
              Play ▶
            </a>
          </>
        )}
      </div>
    </main>
  );
}
