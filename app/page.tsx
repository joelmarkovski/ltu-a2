"use client";
import { useEffect, useMemo, useState } from "react";

// cookie helpers (vanilla)
function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name: string) {
  return document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1] ?? "";
}

export default function HomePage() {
  const [tabs, setTabs] = useState<string[]>(["Tab 1", "Tab 2", "Tab 3"]);
  const [content, setContent] = useState<string[]>([
    "Content for Tab 1 goes here.",
    "Content for Tab 2 goes here.",
    "Content for Tab 3 goes here."
  ]);
  const [active, setActive] = useState<number>(0);

  // track current app theme (.dark on <html>)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // keep active within range
  useEffect(() => {
    if (active >= tabs.length) setActive(Math.max(0, tabs.length - 1));
  }, [tabs.length, active]);

  // remember last active tab
  useEffect(() => {
    const v = getCookie("last_tab_index");
    if (v) setActive(Number(decodeURIComponent(v)));
  }, []);
  useEffect(() => { setCookie("last_tab_index", String(active)); }, [active]);

  // keep content array in sync with tabs length
  useEffect(() => {
    setContent(prev => {
      if (prev.length === tabs.length) return prev;
      if (prev.length < tabs.length) {
        const toAdd = tabs.slice(prev.length).map((t) => `Content for ${t} goes here.`);
        return [...prev, ...toAdd];
      }
      return prev.slice(0, tabs.length);
    });
  }, [tabs]);

  function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const output = useMemo(() => {
    // palette responds to app theme
    const palette = isDark
      ? {
          bodyBg: "#0b0b0b",
          bodyFg: "#f2f2f2",
          border: "#444",
          tabBg: "#333",
          tabFg: "#fff",
          activeBg: "#ffffff",
          activeFg: "#111",
          outline: "#888",
        }
      : {
          bodyBg: "#ffffff",
          bodyFg: "#111111",
          border: "#ccc",
          tabBg: "#f7f7f7",
          tabFg: "#111",
          activeBg: "#ffffff",
          activeFg: "#111111",
          outline: "#333",
        };

    const safeContent = content.map(c => escapeHtml(c).replace(/\n/g, "<br>"));

    const css = `
<style>
  /* page background and text follow theme */
  html, body { background: ${palette.bodyBg}; color: ${palette.bodyFg}; }
  #tabs { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; max-width: 900px; margin: 24px auto; }
  #tablist { display: flex; gap: 6px; border-bottom: 1px solid ${palette.border}; }
  #tablist button {
    border: 1px solid ${palette.border};
    border-bottom: none;
    padding: 8px 12px;
    background: ${palette.tabBg};
    color: ${palette.tabFg};
    cursor: pointer;
  }
  #tablist button[aria-selected="true"] {
    background: ${palette.activeBg};
    color: ${palette.activeFg};
    font-weight: 600;
    outline: 2px solid ${palette.outline};
  }
  #tablist button:hover { filter: brightness(1.1); }
  [role="tabpanel"] { border: 1px solid ${palette.border}; padding: 12px; }
</style>`.trim();

    const js = `
<script>
  (function() {
    function selectTab(index) {
      var buttons = document.querySelectorAll('#tablist button');
      var panels  = document.querySelectorAll('[role="tabpanel"]');

      buttons.forEach(function(btn, i){
        var selected = i === index;
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
        btn.tabIndex = selected ? 0 : -1;
      });

      panels.forEach(function(panel, i){
        panel.style.display = (i === index) ? 'block' : 'none';
      });

      var expires = new Date(Date.now() + 30*24*60*60*1000).toUTCString();
      document.cookie = 'last_tab_index=' + index + '; expires=' + expires + '; path=/; SameSite=Lax';
    }

    // initial select from cookie (or 0)
    var cookie = document.cookie.split('; ').find(r => r.startsWith('last_tab_index='));
    var idx = cookie ? parseInt(cookie.split('=')[1]) : 0;
    window.addEventListener('DOMContentLoaded', function(){ selectTab(isNaN(idx) ? 0 : idx); });

    // expose for buttons
    window.__selectTab = selectTab;

    // ---- Arrow-key accessibility for tabs ----
    document.addEventListener('keydown', function(e){
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      var buttons = Array.from(document.querySelectorAll('#tablist button'));
      if (!buttons.length) return;

      var current = buttons.findIndex(function(b){ return b.getAttribute('aria-selected') === 'true'; });
      if (current < 0) current = 0;

      var next = current;
      if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
      if (e.key === 'ArrowLeft')  next = (current - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End')  next = buttons.length - 1;

      buttons[next].focus();
      window.__selectTab(next);
    });
  })();
</script>`.trim();

    const tabButtons = tabs.map((t, i) =>
`<button role="tab" aria-selected="false" aria-controls="panel-${i}" id="tab-${i}" onclick="window.__selectTab(${i})">${t}</button>`
    ).join("\n      ");

    const tabPanels = tabs.map((t, i) =>
`<div role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" style="display:none;">
  <h3>${t}</h3>
  <div>${safeContent[i] || ""}</div>
</div>`
    ).join("\n");

    const html = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tabs Demo</title>
${css}
</head>
<body>
  <div id="tabs">
    <div id="tablist" role="tablist" aria-label="Sample Tabs">
      ${tabButtons}
    </div>
    ${tabPanels}
  </div>
${js}
</body>
</html>`.trim();

    return html;
  }, [tabs, content, isDark]); // re-render preview when theme changes

  const updateTabLabel = (i: number, value: string) => {
    const next = [...tabs];
    next[i] = value;
    setTabs(next);
  };

  const updateTabContent = (i: number, value: string) => {
    const next = [...content];
    next[i] = value;
    setContent(next);
  };

  // ---- NEW: Save generated output to your Prisma/Next API ----
  async function saveGenerated() {
    try {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "generator",
          payload: { html: output, tabs, content }
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(err || `HTTP ${res.status}`);
      }
      const data = await res.json();
      alert(`Saved! id=${data.id}`);
    } catch (e: any) {
      alert(`Save failed: ${e?.message ?? e}`);
    }
  }

  return (
    <section aria-labelledby="gen-title">
      <h1 id="gen-title" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>Tabs HTML+JS Generator</h1>

      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        {tabs.map((t, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 70 }}>Label {i + 1}</span>
              <input
                aria-label={`Tab ${i + 1} label`}
                className="input"
                value={t}
                onChange={(e) => updateTabLabel(i, e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="radio"
                name="active"
                aria-label={`Set ${t} as active`}
                checked={active === i}
                onChange={() => setActive(i)}
                title="What was the last tab you viewed?"
              />
            </label>

            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Content for {t}</span>
              <textarea
                className="textarea"
                value={content[i] ?? ""}
                onChange={(e) => updateTabContent(i, e.target.value)}
                placeholder={`Write content for ${t}...`}
                aria-label={`Content for ${t}`}
                style={{ height: "8rem" }}
              />
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={() => setTabs((prev) => [...prev, `Tab ${prev.length + 1}`])}>
          + Add Tab
        </button>
        <button
          className="btn"
          onClick={() => setTabs((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
          disabled={tabs.length <= 1}
          aria-disabled={tabs.length <= 1}
          title={tabs.length <= 1 ? "At least one tab required" : "Remove last tab"}
        >
          − Remove Last
        </button>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 8px" }}>Generated Code</h2>
      <textarea aria-label="Generated HTML code" readOnly className="textarea" value={output} />

      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="btn"
          onClick={() => { navigator.clipboard.writeText(output); alert("Code copied!"); }}
        >
          Copy to Clipboard
        </button>

        {/* download Tab.html */}
        <button
          className="btn"
          onClick={() => {
            const blob = new Blob([output], { type: "text/html;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "Tab.html";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Download Tab.html
        </button>

        {/* NEW: save to DB */}
        <button className="btn" onClick={saveGenerated}>
          Save to DB
        </button>

        {/* quick link to the CRUD UI */}
        <a className="btn" href="/saves" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          View Saves →
        </a>
      </div>

      {/* live preview of the generated file */}
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 8px" }}>Live Preview</h2>
      <iframe
        title="Preview"
        style={{ width: "100%", height: 380, border: "1px solid var(--border)", borderRadius: 8 }}
        srcDoc={output}
      />
    </section>
  );
}
