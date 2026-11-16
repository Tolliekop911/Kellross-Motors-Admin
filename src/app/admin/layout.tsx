"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGate, signOutUser } from "@/components/AuthGate";
import { Wordmark } from "@/components/Brand";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin?tab=jobcards", label: "Job Cards" },
  { href: "/admin?tab=invoices", label: "Invoices" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthGate>
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-steel-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <div className="flex items-center gap-6">
              <Link href="/admin"><Wordmark className="text-base" /></Link>
              <nav className="hidden gap-1 sm:flex">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      pathname === n.href.split("?")[0] && (n.href === "/admin" ? true : false)
                        ? "text-steel-900" : "text-steel-500 hover:text-steel-900"
                    }`}>
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-steel-400 hover:text-steel-600">View site</Link>
              <button onClick={signOutUser} className="btn-ghost px-3 py-1.5 text-xs">Sign out</button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </div>
    </AuthGate>
  );
}
