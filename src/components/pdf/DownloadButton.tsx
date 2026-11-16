"use client";

import { useState } from "react";
import type { ReactElement } from "react";

export function DownloadPdfButton({
  document, filename, label = "Download PDF", className = "btn-dark",
}: { document: ReactElement; filename: string; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handle} disabled={busy} className={className}>
      {busy ? "Preparing…" : label}
    </button>
  );
}
