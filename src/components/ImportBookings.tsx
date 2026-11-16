"use client";

import { useRef, useState } from "react";
import { importBookings } from "@/lib/data";
import { parseBookingsCsv, downloadImportTemplate } from "@/lib/csv";

export function ImportBookings({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setBusy(true); setMsg("");
    try {
      const text = await file.text();
      const rows = parseBookingsCsv(text);
      if (!rows.length) { setMsg("No rows found in that file."); return; }
      const n = await importBookings(rows);
      setMsg(`Imported ${n} booking${n === 1 ? "" : "s"}.`);
      onImported();
    } catch {
      setMsg("Could not read that file. Use the template as a guide.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 5000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      <button className="btn-ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Importing…" : "Import"}
      </button>
      {msg && <span className="text-xs text-steel-500">{msg}</span>}
      <button className="text-xs text-steel-400 underline hover:text-steel-600" onClick={downloadImportTemplate}>
        template
      </button>
    </div>
  );
}
