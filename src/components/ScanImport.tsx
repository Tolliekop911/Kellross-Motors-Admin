"use client";

import { useRef, useState } from "react";
import { importBookings } from "@/lib/data";
import { parseBookingsCsv } from "@/lib/csv";

type Stage = "idle" | "scanning" | "review" | "saving";

export function ScanImport({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStage("scanning"); setProgress(0); setMsg("");
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => { if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100)); },
      });
      setText(data.text.trim());
      setStage("review");
    } catch {
      setMsg("Couldn't read that image. Try a clearer, straight-on photo.");
      setStage("idle");
    }
  }

  async function doImport() {
    setStage("saving");
    try {
      const rows = parseBookingsCsv(text);
      if (!rows.length) { setMsg("No appointments found — check the formatting."); setStage("review"); return; }
      const n = await importBookings(rows);
      setMsg(`Imported ${n} booking${n === 1 ? "" : "s"}.`);
      setStage("idle"); setText("");
      onImported();
      setTimeout(() => setMsg(""), 5000);
    } catch {
      setMsg("Import failed."); setStage("review");
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={stage === "scanning"}>
        {stage === "scanning" ? `Reading… ${progress}%` : "Scan photo"}
      </button>
      {msg && stage === "idle" && <span className="ml-2 text-xs text-steel-500">{msg}</span>}

      {(stage === "review" || stage === "saving") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => stage === "review" && setStage("idle")}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-steel-900">Check the scan before importing</h2>
            <p className="mt-1 text-sm text-steel-500">
              OCR isn&apos;t perfect — fix any mistakes. Put <strong>one appointment per line</strong> as:{" "}
              <code className="rounded bg-steel-100 px-1 text-xs">Date, Name, Phone, Vehicle, Service</code>
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              className="field mt-3 min-h-[240px] font-mono text-xs leading-relaxed" />
            {msg && <p className="mt-2 text-sm text-brand">{msg}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setStage("idle"); setMsg(""); }}>Cancel</button>
              <button className="btn-primary" onClick={doImport} disabled={stage === "saving"}>
                {stage === "saving" ? "Importing…" : "Import these"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
