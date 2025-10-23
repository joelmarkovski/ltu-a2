"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/escape-room", label: "Escape Room *NEW*" },
  { href: "/builder", label: "Builder *NEW*" },         // ✅ added
  { href: "/qa", label: "Q&A" },
  { href: "/qa/list", label: "Q&A List" },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // remember last visited page via cookie
  useEffect(() => {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `last_menu=${encodeURIComponent(pathname)}; expires=${expires}; path=/; SameSite=Lax`;
    setOpen(false); // close mobile menu on navigation
  }, [pathname]);

  const Links = ({ vertical = false }: { vertical?: boolean }) => (
    <div
      className="nav"
      style={{ display: "flex", gap: 12, flexDirection: vertical ? "column" : "row" }}
    >
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="desktop-only">
        <Links />
      </div>

      {/* Mobile hamburger */}
      <div className="mobile-only" style={{ position: "relative" }}>
        <button
          className="btn"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰ Menu
        </button>
        {open && (
          <div
            id="mobile-menu"
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "120%",
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              minWidth: 160,
            }}
          >
            <Links vertical />
          </div>
        )}
      </div>
    </>
  );
}
