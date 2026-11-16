import type { ReactElement } from "react";
import type { Booking, JobCard, Invoice } from "./types";
import { invoiceTotals } from "./data";

// --- generic download ---
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

// --- CSV ---
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: (string | number)[][]): Blob {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  // BOM so Excel reads UTF-8 / the rand sign correctly
  return new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
}

export function exportInvoicesCsv(invoices: Invoice[]) {
  const rows = invoices.map((inv) => {
    const t = invoiceTotals(inv);
    return [
      inv.invoiceNo, inv.date, inv.customer, inv.vehicleDetail,
      t.subtotal.toFixed(2), t.vat.toFixed(2), t.total.toFixed(2),
    ];
  });
  download(
    toCsv(["Invoice No", "Date", "Customer", "Vehicle", "Subtotal", "VAT", "Total"], rows),
    `KellRoss-Invoices-${today()}.csv`
  );
}

export function exportJobCardsCsv(jobCards: JobCard[]) {
  const rows = jobCards.map((j) => [
    j.jobCardNo, j.date, j.name, j.model, j.registration, j.km, j.invoiceId ? "Yes" : "No",
  ]);
  download(
    toCsv(["Job Card No", "Date", "Customer", "Vehicle", "Reg", "Km", "Invoiced"], rows),
    `KellRoss-JobCards-${today()}.csv`
  );
}

export function exportBookingsCsv(bookings: Booking[]) {
  const rows = bookings.map((b) => [
    new Date(b.createdAt).toISOString().slice(0, 10),
    b.name, b.cell || b.tel, b.email,
    [b.make, b.model].filter(Boolean).join(" "), b.registration, b.service, b.status,
  ]);
  download(
    toCsv(["Received", "Name", "Phone", "Email", "Vehicle", "Reg", "Service", "Status"], rows),
    `KellRoss-Bookings-${today()}.csv`
  );
}

// --- PDF archive (ZIP) ---
async function zipPdfs(
  items: { name: string; doc: ReactElement }[],
  zipName: string
) {
  const [{ pdf }, JSZip] = await Promise.all([
    import("@react-pdf/renderer"),
    import("jszip").then((m) => m.default),
  ]);
  const zip = new JSZip();
  for (const it of items) {
    const blob = await pdf(it.doc).toBlob();
    zip.file(it.name, blob);
  }
  const out = await zip.generateAsync({ type: "blob" });
  download(out, zipName);
}

export async function exportInvoicesZip(invoices: Invoice[], makeDoc: (inv: Invoice) => ReactElement) {
  await zipPdfs(
    invoices.map((inv) => ({ name: `Invoice-${inv.invoiceNo}.pdf`, doc: makeDoc(inv) })),
    `KellRoss-Invoices-${today()}.zip`
  );
}

export async function exportJobCardsZip(jobCards: JobCard[], makeDoc: (jc: JobCard) => ReactElement) {
  await zipPdfs(
    jobCards.map((jc) => ({ name: `JobCard-${jc.jobCardNo}.pdf`, doc: makeDoc(jc) })),
    `KellRoss-JobCards-${today()}.zip`
  );
}
