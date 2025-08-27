import { STUDENT } from "../config";

export default function AboutPage() {
  return (
    <section aria-labelledby="about-title">
      <h1 id="about-title" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>About</h1>

      <p style={{ margin: "0 0 6px" }}><strong>Created by</strong></p>

      <p style={{ margin: "0 0 6px" }}><strong>Name:</strong> {STUDENT.name}</p>
      <p style={{ margin: "0 0 16px" }}><strong>Student Number:</strong> {STUDENT.number}</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "16px 0 8px" }}>How to use this website</h2>
      <p style={{ margin: "0 0 16px" }}>
        Use the Home page to configure tabs, then copy the generated HTML and paste it into a file like <code>Tab.html</code>. Open it in your browser.
      </p>

      {/* reminder put  MP4 in /public/demo.mp4, or swap this for a YouTube iframe */}
      <div role="group" aria-label="Demo Video">
        <video controls width={720} style={{ maxWidth: "100%" }}>
          <source src="/demo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
