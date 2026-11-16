"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listBookings, listJobCards, listInvoices,
  createJobCardFromBooking, createBlankJobCard, createBlankInvoice, updateBooking, invoiceTotals,
} from "@/lib/data";
import { money } from "@/lib/business";
import type { Booking, JobCard, Invoice, BookingStatus } from "@/lib/types";

type Tab = "bookings" | "jobcards" | "invoices";

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-brand/10 text-brand",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-steel-100 text-steel-500",
};

function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab) || "bookings";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  async function reload() {
    setLoading(true);
    const [b, j, i] = await Promise.all([listBookings(), listJobCards(), listInvoices()]);
    setBookings(b); setJobCards(j); setInvoices(i); setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  const counts = useMemo(() => ({
    newBookings: bookings.filter((b) => b.status === "new").length,
    openJobs: jobCards.filter((j) => !j.invoiceId).length,
  }), [bookings, jobCards]);

  async function openJobCard(b: Booking) {
    setBusyId(b.id);
    try {
      const id = b.jobCardId ?? (await createJobCardFromBooking(b));
      router.push(`/admin/jobcards/${id}`);
    } finally { setBusyId(""); }
  }

  async function newBlank() {
    const id = await createBlankJobCard();
    router.push(`/admin/jobcards/${id}`);
  }

  async function newInvoice() {
    const id = await createBlankInvoice();
    router.push(`/admin/invoices/${id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-steel-900">Workshop</h1>
          <p className="text-sm text-steel-500">
            {counts.newBookings} new booking{counts.newBookings === 1 ? "" : "s"} ·{" "}
            {counts.openJobs} open job card{counts.openJobs === 1 ? "" : "s"}
          </p>
        </div>
        {tab === "invoices" ? (
          <button className="btn-primary" onClick={newInvoice}>+ New invoice</button>
        ) : (
          <button className="btn-primary" onClick={newBlank}>+ New job card</button>
        )}
      </div>

      <div className="mt-6 flex gap-1 rounded-xl border border-steel-200 bg-white p-1 text-sm">
        {(["bookings", "jobcards", "invoices"] as Tab[]).map((t) => (
          <Link key={t} href={`/admin?tab=${t}`}
            className={`flex-1 rounded-lg px-3 py-2 text-center font-medium capitalize transition ${
              tab === t ? "bg-ink text-white" : "text-steel-500 hover:text-steel-900"
            }`}>
            {t === "jobcards" ? "Job Cards" : t}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-steel-400">Loading…</p>
      ) : (
        <div className="mt-6">
          {tab === "bookings" && (
            <Table head={["Received", "Customer", "Vehicle", "Service", "Status", ""]}>
              {bookings.length === 0 && <Empty label="No bookings yet." />}
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-steel-100">
                  <Td>{new Date(b.createdAt).toLocaleDateString("en-ZA")}</Td>
                  <Td>
                    <div className="font-medium text-steel-900">{b.name}</div>
                    <div className="text-xs text-steel-400">{b.cell || b.tel}</div>
                  </Td>
                  <Td>{[b.make, b.model].filter(Boolean).join(" ")} <span className="text-steel-400">{b.registration}</span></Td>
                  <Td>{b.service}</Td>
                  <Td>
                    <select value={b.status}
                      onChange={async (e) => { await updateBooking(b.id, { status: e.target.value as BookingStatus }); reload(); }}
                      className={`chip ${STATUS_STYLE[b.status]} cursor-pointer border-0`}>
                      {(["new","scheduled","in_progress","completed","cancelled"] as BookingStatus[]).map((s) =>
                        <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </Td>
                  <Td className="text-right">
                    <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busyId === b.id} onClick={() => openJobCard(b)}>
                      {b.jobCardId ? "Open job card" : busyId === b.id ? "Creating…" : "Create job card"}
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}

          {tab === "jobcards" && (
            <Table head={["No.", "Date", "Customer", "Vehicle", "Invoice", ""]}>
              {jobCards.length === 0 && <Empty label="No job cards yet." />}
              {jobCards.map((j) => (
                <tr key={j.id} className="border-t border-steel-100">
                  <Td className="font-mono font-semibold text-steel-900">{j.jobCardNo}</Td>
                  <Td>{j.date}</Td>
                  <Td className="font-medium text-steel-900">{j.name || "—"}</Td>
                  <Td>{j.model} <span className="text-steel-400">{j.registration}</span></Td>
                  <Td>{j.invoiceId
                    ? <span className="chip bg-emerald-100 text-emerald-700">Invoiced</span>
                    : <span className="chip bg-steel-100 text-steel-500">Not yet</span>}</Td>
                  <Td className="text-right">
                    <Link className="btn-ghost px-3 py-1.5 text-xs" href={`/admin/jobcards/${j.id}`}>Open</Link>
                  </Td>
                </tr>
              ))}
            </Table>
          )}

          {tab === "invoices" && (
            <Table head={["No.", "Date", "Customer", "Total", ""]}>
              {invoices.length === 0 && <Empty label="No invoices yet." />}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-steel-100">
                  <Td className="font-mono font-semibold text-steel-900">{inv.invoiceNo}</Td>
                  <Td>{inv.date}</Td>
                  <Td className="font-medium text-steel-900">{inv.customer || "—"}</Td>
                  <Td className="font-semibold">{money(invoiceTotals(inv).total)}</Td>
                  <Td className="text-right">
                    <Link className="btn-ghost px-3 py-1.5 text-xs" href={`/admin/invoices/${inv.id}`}>Open</Link>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400">
            {head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-steel-600 ${className}`}>{children}</td>;
}
function Empty({ label }: { label: string }) {
  return <tr><td colSpan={6} className="px-4 py-12 text-center text-steel-400">{label}</td></tr>;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-center text-steel-400">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}
