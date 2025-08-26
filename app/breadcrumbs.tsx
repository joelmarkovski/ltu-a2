"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [{ href: "/", label: "Home" }].concat(
    segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { href, label };
    })
  );

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 16, fontSize: 14 }}>
      {crumbs.map((c, i) => (
        <span key={c.href}>
          <Link className="underline" href={c.href}>{c.label}</Link>
          {i < crumbs.length - 1 ? " / " : ""}
        </span>
      ))}
    </nav>
  );
}
