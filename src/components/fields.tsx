"use client";

import React from "react";

export function LineInput({
  label, value, onChange, type = "text", className = "",
}: {
  label?: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <label className={`flex items-baseline gap-2 ${className}`}>
      {label && <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-steel-500">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 border-b border-steel-300 bg-transparent px-0 py-1 text-sm text-steel-900 outline-none focus:border-brand"
      />
    </label>
  );
}

export function Area({
  label, value, onChange, rows = 4,
}: { label?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      {label && <div className="label">{label}</div>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field resize-y leading-relaxed"
      />
    </div>
  );
}

export function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-steel-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-steel-300 text-brand focus:ring-brand" />
      {label}
    </label>
  );
}

export function SaveBar({
  dirty, saving, onSave, children,
}: { dirty: boolean; saving: boolean; onSave: () => void; children?: React.ReactNode }) {
  return (
    <div className="no-print sticky bottom-0 z-10 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-steel-200 bg-white/95 px-5 py-3 backdrop-blur">
      <span className="text-sm text-steel-400">
        {saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
      </span>
      <div className="flex items-center gap-2">
        {children}
        <button className="btn-primary" onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
