// app/theme-toggle.tsx
"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setDark(root.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.toggle("dark");
    setDark(root.classList.contains("dark"));
  };

  return (
    <button
      onClick={toggle}
      // ✅ stable hooks for testing
      aria-label="Toggle color mode"
      data-testid="theme-toggle"
      className="btn"
    >
      {dark ? "Dark Mode" : "Light Mode"}
    </button>
  );
}
