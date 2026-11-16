"use client";

import { useEffect, useRef, useState } from "react";
import type { Booking, JobCard, Invoice } from "@/lib/types";
import {
  exportInvoicesCsv, exportJobCardsCsv, exportBookingsCsv,
  exportInvoicesZip, exportJobCardsZip,
} from "@/lib/export";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { JobCardPDF } from "@/components/pdf/JobCardPDF";

export function ExportMenu({
  bookings, jobCards, invoices,
}: { bookings: Booking[]; jobCards: JobCard[]; invoices: Invoice[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function run(label: string, fn: () => void | Promise<void>) {
    setBusy(label);
    try { await fn(); } finally { setBusy(""); setOpen(false); }
  }

  const Item = ({ label, note, onClick }: { label: string; note: string; onClick: () => void }) => (
    <button onClick={onClick} disabled={!!busy}
      className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm hover:bg-steel-50 disabled:opacity-50">
      <span className="font-medium text-steel-800">{label}</span>
      <span className="text-xs text-steel-400">{busy === label ? "Preparing…" : note}</span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost" onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card">
          <div className="border-b border-steel-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-steel-400">
            Spreadsheets (accounting)
          </div>
          <Item label="Invoices → CSV" note={`${invoices.length}`} onClick={() => run("Invoices → CSV", () => exportInvoicesCsv(invoices))} />
          <Item label="Job cards → CSV" note={`${jobCards.length}`} onClick={() => run("Job cards → CSV", () => exportJobCardsCsv(jobCards))} />
          <Item label="Bookings → CSV" note={`${bookings.length}`} onClick={() => run("Bookings → CSV", () => exportBookingsCsv(bookings))} />

          <div className="border-y border-steel-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-steel-400">
            PDF archive (filing)
          </div>
          <Item label="All invoice PDFs → ZIP" note={`${invoices.length}`}
            onClick={() => run("All invoice PDFs → ZIP", () => exportInvoicesZip(invoices, (inv) => <InvoicePDF inv={inv} />))} />
          <Item label="All job card PDFs → ZIP" note={`${jobCards.length}`}
            onClick={() => run("All job card PDFs → ZIP", () => exportJobCardsZip(jobCards, (jc) => <JobCardPDF jc={jc} />))} />
        </div>
      )}
    </div>
  );
}
