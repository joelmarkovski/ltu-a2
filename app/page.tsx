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
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    const v = getCookie("last_tab_index");
    if (v) setActive(Number(decodeURIComponent(v)));
  }, []);
  useEffect(() => { setCookie("last_tab_index", String(active)); }, [active]);

  const output = useMemo(() => {
    const css = `
<style>
  #tabs { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; max-width: 900px; margin: 24px auto; }
  #tablist { display: flex; gap: 6px; border-bottom: 1px solid #ccc; }
  #tablist button { border: 1px solid #ccc; border-bottom: none; padding: 8px 12px; background: #f7f7f7; cursor: pointer; }
  #tablist button[aria-selected="true"] { background: #fff; font-weight: 600; outline: 2px solid #333; }
  .panel { border: 1px solid #ccc; padding: 12px; }
</style>`.trim();

    const js = `
<script>
  (function() {
    function selectTab(index) {
      var buttons = document.querySelectorAll('#tablist button');
      var panels  = document.querySelectorAll('.panel');

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

    var cookie = document.cookie.split('; ').find(r => r.startsWith('last_tab_index='));
    var idx = cookie ? parseInt(cookie.split('=')[1]) : 0;
    window.addEventListener('DOMContentLoaded', function(){ selectTab(isNaN(idx) ? 0 : idx); });
    window.__selectTab = selectTab;
  })();
</script>`.trim();

    const tabButtons = tabs.map((t, i) =>
`<button role="tab" aria-selected="false" aria-controls="panel-${i}" id="tab-${i}" onclick="window.__selectTab(${i})">${t}</button>`
    ).join("\n      ");

    const tabPanels = tabs.map((t, i) =>
`<div role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" class="panel" style="display:none;">
  <h3>${t}</h3>
  <p>Content for ${t} goes here.</p>
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
  }, [tabs]);

  const updateTabLabel = (i: number, value: string) => {
    const next = [...tabs];
    next[i] = value;
    setTabs(next);
  };

  return (
    <section aria-labelledby="gen-title">
      <h1 id="gen-title" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>Tabs HTML+JS Generator</h1>

      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        {tabs.map((t, i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => setTabs((prev) => [...prev, `Tab ${prev.length + 1}`])}>
          + Add Tab
        </button>
        <button className="btn" onClick={() => setTabs((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}>
          − Remove Last
        </button>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 8px" }}>Generated Code</h2>
      <textarea
        aria-label="Generated HTML code"
        readOnly
        className="textarea"
        value={output}
      />
      <div style={{ marginTop: 8 }}>
        <button
          className="btn"
          onClick={() => { navigator.clipboard.writeText(output); alert("Code copied!"); }}
        >
          Copy to Clipboard
        </button>
      </div>
    </section>
  );
}
