"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* tiny inline icons */
const PlayIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z"/></svg>);
const PauseIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>);
const ResetIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 6v3l4-4-4-4v3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7z"/></svg>);

const parseMaybeNumber = (v: string) => (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v);

export default function EscapeRoom() {
  /* TIMER */
  const presets = { Easy: { mins: 8, secs: 0 }, Normal: { mins: 5, secs: 0 }, Hard: { mins: 3, secs: 0 } } as const;
  const [preset, setPreset] = useState<keyof typeof presets>("Normal");
  const [mins, setMins] = useState<number>(presets[preset].mins);
  const [secs, setSecs] = useState<number>(presets[preset].secs);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState<number>(presets[preset].mins * 60 + presets[preset].secs);
  const tickRef = useRef<number | null>(null);
  const totalSeconds = mins * 60 + secs;
  const timeUp = remaining === 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => setRemaining(r => (r > 0 ? r - 1 : 0)), 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [running]);
  useEffect(() => { if (!running) setRemaining(totalSeconds); }, [mins, secs, running, totalSeconds]);
  useEffect(() => { if (timeUp && running) { setRunning(false); alert("⏰ Time’s up! Reset the timer to try again."); }}, [timeUp, running]);
  function applyPreset(p: keyof typeof presets) {
    setPreset(p); setMins(presets[p].mins); setSecs(presets[p].secs);
    setRunning(false); setRemaining(presets[p].mins * 60 + presets[p].secs);
  }

  /* STAGES */
  type StageKey = 1 | 2 | 3 | 4;
  type StageState = "locked" | "in-progress" | "done";
  const [stage, setStage] = useState<StageKey>(1);
  const [s1, setS1] = useState<StageState>("in-progress");
  const [s2, setS2] = useState<StageState>("locked");
  const [s3, setS3] = useState<StageState>("locked");
  const [s4, setS4] = useState<StageState>("locked");
  const progress = useMemo(() => [s1, s2, s3, s4].filter(s => s === "done").length / 4, [s1, s2, s3, s4]);

  /* Stage 1 – JSON prettifier */
  const messy = `{"name":"Ada","skills":["js","ts"],"active":true,"scores":{"a":1,"b":2}}`;
  const [input1, setInput1] = useState(messy);
  const [valid1, setValid1] = useState(false);
  function prettyFormatJSON() {
    try { const o = JSON.parse(input1); setInput1(JSON.stringify(o, null, 2)); setValid1(true); setS1("done"); setS2("in-progress"); setStage(2); }
    catch { setValid1(false); alert("Invalid JSON. Fix the syntax and try again."); }
  }

  /* Stage 2 – click hotspot */
  function clickHotspot() { setS2("done"); setS3("in-progress"); setStage(3); alert("🛠️ Debugger opened! Proceed to the next challenge."); }

  /* Stage 3 – 0..1000 loop */
  const [code3, setCode3] = useState(`// Write JS that outputs 0..1000\nfor (let i = 0; i <= 1000; i++) { console.log(i); }`);
  const [ok3, setOk3] = useState(false);
  function validateCode3() {
    const hasFor = /for\s*\(/.test(code3);
    const hasZero = /(^|[^0-9])0([^0-9]|$)/.test(code3);
    const hasThousand = /(^|[^0-9])1000([^0-9]|$)/.test(code3);
    const outputs = /console\.log\(|push\(|document\.write\(|join\(/.test(code3);
    const valid = hasFor && hasZero && hasThousand && outputs;
    setOk3(valid);
    if (valid) { setS3("done"); setS4("in-progress"); setStage(4); }
    else alert("Tip: use a for-loop from 0 to 1000 and output the numbers.");
  }

  /* Stage 4 – CSV -> JSON */
  const sampleCSV = `id,name,points
1,Ada,8
2,Linus,10
3,Grace,9`;
  const [csvIn, setCsvIn] = useState(sampleCSV);
  const [jsonOut, setJsonOut] = useState("");
  function csvToJson() {
    try {
      const [head, ...rows] = csvIn.trim().split(/\r?\n/);
      const headers = head.split(",").map(h => h.trim());
      const data = rows.map(line => {
        const cols = line.split(",").map(c => c.trim());
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => (obj[h] = parseMaybeNumber(cols[i])));
        return obj;
      });
      setJsonOut(JSON.stringify(data, null, 2));
      setS4("done");
    } catch { alert("CSV parse error. Check your commas/lines."); }
  }

  /* NEXT + RESET */
  function nextStage() {
    if (stage === 1 && s1 !== "done") return;
    if (stage === 2 && s2 !== "done") return;
    if (stage === 3 && s3 !== "done") return;
    if (stage === 4 && s4 !== "done") return;
    setStage(Math.min(4, ((stage + 1) as StageKey)));
  }
  function resetAll() {
    setRunning(false); setRemaining(totalSeconds);
    setStage(1); setS1("in-progress"); setS2("locked"); setS3("locked"); setS4("locked");
    setInput1(messy); setValid1(false);
    setCode3(`// Write JS that outputs 0..1000\nfor (let i = 0; i <= 1000; i++) { console.log(i); }`);
    setOk3(false); setCsvIn(sampleCSV); setJsonOut("");
  }

  /* ============ NEW: SAVE / LOAD PROGRESS ============ */
  async function saveProgress() {
    const payload = {
      stage,
      timer: { preset, mins, secs, remaining, running },
      states: { s1, s2, s3, s4 },
      data: { input1, code3, csvIn, jsonOut },
    };
    const res = await fetch("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "escape-progress", payload }),
    });
    if (!res.ok) return alert("Save failed");
    const row = await res.json();
    alert("Progress saved, id " + row.id);
  }

  async function loadLastProgress() {
    const res = await fetch("/api/saves", { cache: "no-store" });
    const list = await res.json();
    const last = list.find((x: any) => x.type === "escape-progress");
    if (!last) return alert("No saved progress found.");
    try {
      const p = JSON.parse(last.payload);
      setStage(p.stage ?? 1);
      setMins(p.timer?.mins ?? mins);
      setSecs(p.timer?.secs ?? secs);
      setRunning(false);
      setRemaining(p.timer?.remaining ?? remaining);
      setS1(p.states?.s1 ?? "in-progress");
      setS2(p.states?.s2 ?? "locked");
      setS3(p.states?.s3 ?? "locked");
      setS4(p.states?.s4 ?? "locked");
      setInput1(p.data?.input1 ?? input1);
      setCode3(p.data?.code3 ?? code3);
      setCsvIn(p.data?.csvIn ?? csvIn);
      setJsonOut(p.data?.jsonOut ?? "");
      alert("Loaded last progress.");
    } catch { alert("Could not parse saved progress."); }
  }
  /* ============================================================================== */

  const stageTitle = ({1:"Stage 1: Format Code Correctly (JSON)",2:"Stage 2: Click the Debugger Hotspot",3:"Stage 3: Output Numbers 0..1000",4:"Stage 4: Port Data (CSV → JSON)"} as const)[stage];

  return (
    <section aria-labelledby="escape-title">
      <h1 id="escape-title" className="text-2xl font-semibold mb-3">Escape Room</h1>

      {/* timer + toolbar */}
      <div className="grid gap-2 mb-4">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Difficulty
            <select className="input" value={preset} onChange={(e)=>applyPreset(e.target.value as any)}>
              {Object.keys(presets).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>Minutes <input className="input" type="number" min={0} max={59} value={mins} onChange={(e)=>setMins(Number(e.target.value)||0)} style={{ width: 80 }} /></label>
          <label>Seconds <input className="input" type="number" min={0} max={59} value={secs} onChange={(e)=>setSecs(Number(e.target.value)||0)} style={{ width: 80 }} /></label>

          <button className="btn" onClick={()=>setRunning(r=>!r)} disabled={timeUp}>
            {running ? <PauseIcon/> : <PlayIcon/>} {running ? "Pause" : "Start"}
          </button>
          <button className="btn" onClick={resetAll}><ResetIcon/> Reset</button>

          {/* NEW: save/load */}
          <button className="btn" onClick={saveProgress}>Save Progress</button>
          <button className="btn" onClick={loadLastProgress}>Load Last Round</button>

          <div style={{ fontFamily: "ui-monospace,monospace" }} aria-live="polite">⏱ {mm}:{ss}</div>

          <div title="progress" style={{ marginLeft: "auto", minWidth: 160 }}>
            <div style={{ height: 8, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${progress*100}%`, height: "100%" }} />
            </div>
          </div>
        </div>
        {timeUp && <p role="alert" style={{ color: "crimson" }}>Time’s up!</p>}
      </div>

      {/* stgtage area */}
      <div
        style={{
          position: "relative",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
          minHeight: 420,
          background: `center / cover no-repeat url(/escape-bg.jpg)`,
        }}
        aria-label="Escape room background"
      >
        <div style={{ backdropFilter: "brightness(0.95)", padding: 12 }}>
          <h2 className="text-xl font-semibold mb-2">{stageTitle}</h2>

          {stage === 1 && (
            <div className="grid gap-8">
              <p>Format this JSON.</p>
              <textarea className="textarea" value={input1} onChange={(e)=>setInput1(e.target.value)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn" onClick={prettyFormatJSON}>Format JSON</button>
                <button className="btn" onClick={nextStage} disabled={!valid1}>Next</button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="grid gap-3">
              <p>Somewhere in this room is a <strong>debugger</strong>. Click the correct spot.</p>
              <p style={{ fontSize: 12, opacity: 0.75 }}>Hint: try the monitor.</p>
              <button
                aria-label="Open Debugger"
                onClick={clickHotspot}
                style={{
                  position: "absolute",
                  right: 48, bottom: 88, width: 140, height: 90,
                  border: "2px dashed rgba(255,255,255,0.6)",
                  background: "rgba(0,0,0,0.1)", borderRadius: 10,
                }}
                title="Debugger"
              />
              <div><button className="btn" onClick={nextStage} disabled={s2 !== "done"}>Next</button></div>
            </div>
          )}

          {stage === 3 && (
            <div className="grid gap-3">
              <p>Write JavaScript that outputs <strong>0 to 1000</strong>.</p>
              <textarea className="textarea" value={code3} onChange={(e)=>setCode3(e.target.value)} />
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn" onClick={validateCode3}>Validate</button>
                <button className="btn" onClick={nextStage} disabled={!ok3}>Next</button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="grid gap-3">
              <p>Convert this CSV to JSON.</p>
              <label>CSV Input</label>
              <textarea className="textarea" value={csvIn} onChange={(e)=>setCsvIn(e.target.value)} style={{ height: "8rem" }} />
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn" onClick={csvToJson}>Convert</button>
                <span aria-live="polite" style={{ alignSelf: "center" }}>{s4 === "done" ? "✅ Converted" : ""}</span>
              </div>
              <label>JSON Output</label>
              <textarea className="textarea" readOnly value={jsonOut} style={{ height: "8rem" }} />
              {s4 === "done" && <p><strong>🎉 Escaped!</strong> You completed every stage.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
