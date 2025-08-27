import { STUDENT } from "../config";

export default function AboutPage() {
  return (
    <section aria-labelledby="about-title">
      <h1 id="about-title" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>About</h1>

      <p style={{ margin: "0 0 6px" }}><strong>Name:</strong> {STUDENT.name}</p>
      <p style={{ margin: "0 0 16px" }}><strong>Student Number:</strong> {STUDENT.number}</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "16px 0 8px" }}>How to use this website</h2>

      <figure aria-label="How do I use this website?" style={{ margin: 0 }}>
        <video controls width={720} style={{ maxWidth: "100%" }} poster="/demo-poster.jpg">
          <source src="/demo.mp4" type="video/mp4" />
          Your browser does not support the video tag. <a href="/demo.mp4">Download the video</a>.
        </video>
        <figcaption style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>
          Short demo showing pages, theme toggle, cookies, and the code generator. Voiced by Joel Markovski
        </figcaption>
      </figure>
    </section>
  );
}
