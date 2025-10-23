// app/play/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PlayGame({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const game = await prisma.escapeGame.findUnique({
    where: { id },
    include: {
      stages: { include: { question: true }, orderBy: { orderIndex: "asc" } },
    },
  });

  if (!game) {
    return (
      <main className="container" style={{ padding: 24 }}>
        <p>Game not found.</p>
        <Link href="/builder" className="btn">
          Back to Builder
        </Link>
      </main>
    );
  }

  // 🔒 Narrow JSON -> string[] to satisfy TS
  const images = Array.isArray(game.images)
    ? (game.images as unknown as string[])
    : [];

  // 🖼️ Pick the first image as backdrop (with a safe fallback)
  const bg = images[0] ?? "/escape-bg-1.jpg";

  return (
    <main
      className="container"
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "2rem",
      }}
    >
      {/* Dark overlay to ensure readability */}
      <div
        style={{
          backdropFilter: "brightness(0.85)",
          background: "rgba(0, 0, 0, 0.35)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1>{game.title}</h1>
        {game.description && (
          <p style={{ opacity: 0.9, fontSize: "1rem", marginBottom: 20 }}>
            {game.description}
          </p>
        )}

        {/* Show backdrop preview thumbnails if multiple exist */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {images.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                style={{
                  width: 140,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.4)",
                  opacity: url === bg ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        )}

        <ol style={{ display: "grid", gap: 16 }}>
          {game.stages.map((s, i) => (
            <li
              key={s.id}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                padding: 16,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <h2>Stage {i + 1}</h2>
              <p>
                <strong>Question:</strong> {s.question.question}
              </p>
              {s.hint && (
                <p style={{ opacity: 0.9 }}>
                  <em>Hint:</em> {s.hint}
                </p>
              )}
              {typeof s.timerSecs === "number" && <p>Timer: {s.timerSecs}s</p>}

              {/* Answer reveal for demonstration */}
              <details style={{ marginTop: 8 }}>
                <summary>Show answer (demo)</summary>
                <pre style={{ whiteSpace: "pre-wrap" }}>{s.question.answer}</pre>
              </details>
            </li>
          ))}
        </ol>

        <p style={{ marginTop: 24 }}>
          <Link className="btn" href="/builder">
            ← Back to Builder
          </Link>
        </p>
      </div>
    </main>
  );
}
