"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!ready) return <div aria-hidden="true" style={{ width: 88 }} />;
  return (
    <button aria-label="Toggle theme" onClick={toggle} className="btn">
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
