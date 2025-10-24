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