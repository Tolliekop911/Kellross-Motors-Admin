"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { ConfigNotice } from "@/components/ConfigNotice";
import { firebaseReady } from "@/lib/firebase";

const NAV = [
  { href: "/admin?tab=bookings", label: "Bookings" },
  { href: "/admin?tab=jobcards", label: "Job Cards" },
  { href: "/admin?tab=invoices", label: "Invoices" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-steel-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 lg:px-10 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin"><Wordmark className="text-base" /></Link>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-steel-500 transition hover:text-steel-900">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-sm text-steel-400 hover:text-steel-600">View site</Link>
        </div>
      </header>
      <main className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-8">
        {firebaseReady ? children : <div className="py-10"><ConfigNotice /></div>}
      </main>
    </div>
  );
}
