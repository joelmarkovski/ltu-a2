import "./globals.css";
import type { Metadata } from "next";
import { STUDENT } from "./config";
import ThemeToggle from "./theme-toggle";
import Nav from "./nav";
import Breadcrumbs from "./breadcrumbs";
import Link from "next/link";


export const metadata: Metadata = {
  title: "LTU A1 – Code Generator",
  description: "Assignment 1: Next.js app that outputs HTML+JS with inline CSS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2" style={{ padding: 8, background: "black", color: "white", borderRadius: 8 }}>
          Skip to main content
        </a>

        <header className="header">
          <div className="container header-bar">
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontWeight: 600 }}>
              {STUDENT.number}
            </div>
            <Nav />
            <ThemeToggle />
          </div>
        </header>

        <main id="main" className="container" style={{ padding: "24px 0" }}>
          <Breadcrumbs />
          {children}
        </main>

        <footer className="footer">
          <div className="container footer-inner">
            <div>© {new Date().getFullYear()} {STUDENT.name} — {STUDENT.number}</div>
            <div>{new Date().toLocaleDateString()}</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
