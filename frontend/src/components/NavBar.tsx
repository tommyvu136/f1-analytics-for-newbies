"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/analytics", label: "Race Analytics" },
  { href: "/standings", label: "Standings" },
  { href: "/countdown", label: "Countdown" },
  { href: "/noobs", label: "F1 for Noobs" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-f1-border bg-f1-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-f1-red">F1</span>
          <div>
            <p className="text-sm font-bold leading-tight">Analytics for Noobs</p>
            <p className="text-xs text-f1-muted">2026 Season</p>
          </div>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-f1-red text-white" : "text-f1-muted hover:bg-f1-card hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
