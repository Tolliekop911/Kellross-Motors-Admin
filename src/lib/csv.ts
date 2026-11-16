import type { ImportRow } from "./data";

// Minimal CSV parser (handles quoted fields, commas and newlines inside quotes).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const COLS = ["date", "name", "phone", "email", "make", "model", "registration", "service", "notes"] as const;

// Map header names (case/spacing-insensitive) to our fields.
const ALIASES: Record<string, (typeof COLS)[number]> = {
  date: "date", day: "date",
  name: "name", customer: "name", client: "name",
  phone: "phone", cell: "phone", tel: "phone", telephone: "phone", contact: "phone",
  email: "email",
  make: "make",
  model: "model", vehicle: "model", car: "model",
  registration: "registration", reg: "registration", plate: "registration",
  service: "service", work: "service", job: "service",
  notes: "notes", note: "notes", comment: "notes", comments: "notes",
};

export function parseBookingsCsv(text: string): ImportRow[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const mapped = header.map((h) => ALIASES[h]);
  // If the first row doesn't look like a header, treat columns positionally.
  const hasHeader = mapped.some(Boolean);
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map((cells) => {
    const obj: ImportRow = {};
    cells.forEach((val, i) => {
      const key = hasHeader ? mapped[i] : COLS[i];
      if (key) obj[key] = val.trim();
    });
    return obj;
  });
}

export function downloadImportTemplate() {
  const header = "Date,Name,Phone,Email,Make,Model,Registration,Service,Notes";
  const example = "2026-11-20,John Smith,082 123 4567,,Toyota,Hilux,CA 123-456,Major Service,Brought in by owner";
  const blob = new Blob(["﻿" + header + "\r\n" + example + "\r\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "KellRoss-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
