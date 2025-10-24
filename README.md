This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


TU A2 — Escape Room Builder & Publisher

A full-stack Next.js + Prisma app where users build an escape/court-room style game, then publish a static, playable HTML to S3 via an AWS Lambda. Includes Dockerized deployment on EC2, CRUD APIs, and a simple “Play” experience with per-stage timers.

#  Features

Builder UI

Create a game (title, description)

Add ordered stages, each linked to a Question (Q/A), with timer + optional hint

Choose a backdrop (preset images)

Q&A Manager

CRUD for questions (slug, question, answer)

Safe deletes with force=true option (removes referencing stages)

Publisher

Lambda fetches game JSON from your EC2 API and renders static HTML

Uploads to S3 (games/{id}.html), returns public URL

APIs & DB

Prisma + SQLite schema

REST endpoints under /api/qa, /api/games, /api/games/:id

Deployment

Docker image running on EC2

Function URL for Lambda with CORS restricted to your EC2 origin

# Tech Stack//

Frontend/SSR: Next.js (App Router), React

DB/ORM: SQLite + Prisma

Runtime: Node.js 20 (app), Node.js 22 (Lambda)

Cloud: AWS EC2 (app), AWS Lambda (publisher), S3 (static output)

Containerization: Docker

# API Endpoints (REST)
Q&A

GET /api/qa?q=term → list/search

POST /api/qa → upsert by slug

{ "slug": "water", "question": "Formula?", "answer": "H2O" }


DELETE /api/qa?slug=water

?force=true to remove referencing stages first

Also accepts JSON body { "slug": "..." } or { "id": 1 }

Games

POST /api/games → create

{
  "title": "My Escape Game",
  "description": "Demo",
  "backdrop": "/escape-bg-1.jpg",
  "images": ["/escape-bg-1.jpg"],
  "stages": [
    { "questionId": 1, "orderIndex": 0, "timerSecs": 60, "hint": "Think small" }
  ]
}


GET /api/games → recent list (debugging)

GET /api/games/:id → one game (includes stages.question)

PATCH /api/games/:id → update + replace stages (atomic)


# KNOWN BUGS
* Sometimes DELETE Api doesnt work (not sure why)
* dockerisation start takes a very long time
* Backdrop on poublished game sometimes doesnt come through

# Links
https://github.com/joelmarkovski/ltu-a2


# Lambda Function
// index.mjs — Node.js 22.x
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.REGION || process.env.AWS_REGION || "ap-southeast-2";
const BUCKET = process.env.BUCKET;                 // . ltu-a2-published-21015477
const API_BASE_URL = process.env.API_BASE_URL;     // . http://13.220.91.48:3000
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 10000);
const FETCH_RETRIES = Number(process.env.FETCH_RETRIES || 1);

const s3 = new S3Client({ region: REGION });

const headersJSON = { "content-type": "application/json; charset=utf-8" };
const ok  = (body) => ({ statusCode: 200, headers: headersJSON, body: JSON.stringify(body) });
const bad = (code, message, extra = {}) =>
  ({ statusCode: code, headers: headersJSON, body: JSON.stringify({ error: message, ...extra }) });

const safeParse = (s) => { try { return typeof s === "string" ? JSON.parse(s) : (s ?? {}); } catch { return {}; } };
const esc = (s = "") => String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

// Turn relative `/public/...` paths into absolute URLs against your Next.js host
function absUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE_URL}${u}`;
  return `${API_BASE_URL}/${u}`;
}

async function fetchJSONWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, text, data };
  } finally { clearTimeout(t); }
}

async function fetchJSON(url, { context } = {}) {
  const remain = context?.getRemainingTimeInMillis?.() ?? (FETCH_TIMEOUT_MS + 5000);
  const timeoutMs = Math.min(FETCH_TIMEOUT_MS, Math.max(500, remain - 1500));
  let lastErr, attempt = 0;

  while (attempt <= FETCH_RETRIES) {
    try { return await fetchJSONWithTimeout(url, timeoutMs); }
    catch (e) {
      lastErr = e;
      const msg = String(e?.name || e?.message || e);
      if (!/AbortError|aborted|network|fetch failed/i.test(msg)) break;
      if (attempt === FETCH_RETRIES) break;
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      attempt++;
    }
  }
  throw new Error(`Fetch failed: ${url} (timeoutMs=${timeoutMs}) — ${String(lastErr?.message || lastErr)}`);
}

const renderQA = (q) => `<!doctype html><meta charset="utf-8"/>
<title>${esc(q.slug)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:16px/1.5 system-ui;margin:2rem;max-width:900px}pre{background:#111;color:#fff;padding:1rem;border-radius:10px}</style>
<h1>${esc(q.question)}</h1><pre>${esc(q.answer)}</pre><small>Published via Lambda → S3</small>`;

// Pick a backdrop from game fields: `backdrop` string, or first of `images` JSON, or `selectedBackdrop`
function pickBackdrop(g) {
  const fromField = g?.backdrop || g?.selectedBackdrop || null;
  if (fromField) return absUrl(fromField);

  // images could be: string | string[] | {url:string}[]
  const imgs = g?.images;
  if (!imgs) return null;
  try {
    if (Array.isArray(imgs)) {
      const first = imgs[0];
      if (!first) return null;
      if (typeof first === "string") return absUrl(first);
      if (typeof first?.url === "string") return absUrl(first.url);
      return null;
    }
    // if stored as a single string in JSON
    if (typeof imgs === "string") return absUrl(imgs);
    if (typeof imgs?.url === "string") return absUrl(imgs.url);
  } catch {}
  return null;
}

const renderGame = (g) => {
  const bg = pickBackdrop(g);
  const bgCss = bg ? `body{background:url('${esc(bg)}') center/cover fixed no-repeat}` : "";
  return `<!doctype html><meta charset="utf-8"/>
<title>${esc(g.title)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font:16px/1.5 system-ui;margin:2rem;max-width:900px}
  li{margin:.5rem 0;padding:.5rem;border:1px solid #ddd;border-radius:8px}
  ${bgCss}
</style>
<h1>${esc(g.title)}</h1>${g.description ? `<p>${esc(g.description)}</p>` : ""}
<ol>${
  (g.stages || []).map((s,i)=> `<li>
    <h3>Stage ${i+1}</h3>
    <p><strong>Q:</strong> ${esc(s?.question?.question ?? "")}</p>
    ${s?.hint ? `<p><em>Hint:</em> ${esc(s.hint)}</p>` : ""}
    ${typeof s?.timerSecs === "number" ? `<p>Timer: ${s.timerSecs}s</p>` : ""}
  </li>`).join("")
}</ol>`;
};

export const handler = async (event, context) => {
  try {
    const body = safeParse(event?.body);
    if (body?.ping) return ok({ pong: true, ts: Date.now(), region: REGION });

    if (!BUCKET || !API_BASE_URL) {
      return bad(500, "Missing required environment variables", { required: ["BUCKET", "API_BASE_URL"], REGION });
    }

    const { slug, gameId } = body || {};
    if (!slug && !gameId) return bad(400, "Provide 'slug' or 'gameId'");

    let key, html;

    if (slug) {
      const u = `${API_BASE_URL}/api/qa?q=${encodeURIComponent(slug)}`;
      const r = await fetchJSON(u, { context });
      if (!r.ok) return bad(502, "Upstream /api/qa failed", { status: r.status, body: r.text, url: u });
      const arr = Array.isArray(r.data) ? r.data : [];
      const q = arr.find((x) => x?.slug === slug);
      if (!q) return bad(404, "Question not found", { slug });
      key = `qa/${slug}.html`;
      html = renderQA(q);
    } else {
      const u = `${API_BASE_URL}/api/games/${encodeURIComponent(gameId)}`;
      const r = await fetchJSON(u, { context });
      if (!r.ok) {
        return bad(r.status === 404 ? 404 : 502,
          r.status === 404 ? "Game not found" : "Upstream /api/games failed",
          { status: r.status, body: r.text, url: u, gameId });
      }
      const g = r.data;
      if (!g?.id) return bad(502, "Invalid game payload from upstream", { got: r.data });
      key = `games/${g.id}.html`;
      html = renderGame(g);
    }

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: html,
      ContentType: "text/html; charset=utf-8",
    }));

    const url = `https://${BUCKET}.s3.amazonaws.com/${key}`;
    return ok({ url });

  } catch (e) {
    return bad(500, "Internal Server Error", { detail: String(e?.message || e) });
  }
};
