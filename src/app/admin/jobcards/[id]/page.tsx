"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getJobCard, saveJobCard, createInvoiceFromJobCard } from "@/lib/data";
import { BUSINESS, money } from "@/lib/business";
import type { JobCard, PartLine } from "@/lib/types";
import { LineInput, Area, Toggle, SaveBar } from "@/components/fields";
import { DownloadPdfButton } from "@/components/pdf/DownloadButton";
import { JobCardPDF } from "@/components/pdf/JobCardPDF";

export default function JobCardEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [jc, setJc] = useState<JobCard | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getJobCard(id).then((d) => (d ? setJc(d) : setNotFound(true)));
  }, [id]);

  function up<K extends keyof JobCard>(key: K, value: JobCard[K]) {
    setJc((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }

  async function save() {
    if (!jc) return;
    setSaving(true);
    const { id: _id, ...patch } = jc;
    await saveJobCard(id, patch);
    setSaving(false); setDirty(false);
  }

  async function makeInvoice() {
    if (!jc) return;
    if (dirty) await save();
    if (jc.invoiceId) { router.push(`/admin/invoices/${jc.invoiceId}`); return; }
    const invId = await createInvoiceFromJobCard(jc);
    router.push(`/admin/invoices/${invId}`);
  }

  if (notFound) return <p className="text-center text-steel-400">Job card not found. <Link className="text-brand" href="/admin">Back</Link></p>;
  if (!jc) return <p className="text-center text-steel-400">Loading…</p>;

  const toggleCode = (code: string) =>
    up("damageCodes", jc.damageCodes.includes(code) ? jc.damageCodes.filter((c) => c !== code) : [...jc.damageCodes, code]);

  const partsTotal = jc.parts.reduce((s, p) => s + (p.price || 0), 0);

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/admin?tab=jobcards" className="text-sm text-steel-400 hover:text-steel-600">← Job cards</Link>
        <div className="flex items-center gap-2">
          <DownloadPdfButton document={<JobCardPDF jc={jc} />} filename={`JobCard-${jc.jobCardNo}.pdf`} label="Download PDF" />
          <button className="btn-primary" onClick={makeInvoice}>{jc.invoiceId ? "Open invoice" : "Create invoice"}</button>
        </div>
      </div>

      {/* Sheet */}
      <div className="card p-6">
        <div className="flex items-start justify-between border-b border-steel-200 pb-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Kell<span className="text-brand">Ross</span> Motors CC</h1>
            <p className="text-xs text-steel-500">{BUSINESS.address} · Tel {BUSINESS.tel} · {BUSINESS.email}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wide text-steel-500">Job Card</div>
            <div className="font-mono text-2xl font-bold text-brand">{jc.jobCardNo}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <LineInput label="Name" value={jc.name} onChange={(v) => up("name", v)} />
            <LineInput label="Address" value={jc.address} onChange={(v) => up("address", v)} />
            <LineInput label="Tel" value={jc.tel} onChange={(v) => up("tel", v)} />
            <LineInput label="Cell" value={jc.cell} onChange={(v) => up("cell", v)} />
            <LineInput label="Email" value={jc.email} onChange={(v) => up("email", v)} />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs font-medium uppercase tracking-wide text-steel-500">Payment:</span>
              {([["cash","Cash"],["eft","EFT"],["card","Debit/Credit"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="pay" checked={jc.methodOfPayment === v}
                    onChange={() => up("methodOfPayment", v)} className="text-brand focus:ring-brand" />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <LineInput label="Date" type="date" value={jc.date} onChange={(v) => up("date", v)} />
            <LineInput label="Model" value={jc.model} onChange={(v) => up("model", v)} />
            <LineInput label="Reg No" value={jc.registration} onChange={(v) => up("registration", v)} />
            <LineInput label="Km" value={jc.km} onChange={(v) => up("km", v)} />
            <LineInput label="Vin No" value={jc.vin} onChange={(v) => up("vin", v)} />
            <LineInput label="Fab No" value={jc.fabNo} onChange={(v) => up("fabNo", v)} />
            <LineInput label="Radio Code" value={jc.radioCode} onChange={(v) => up("radioCode", v)} />
            <LineInput label="Key Code" value={jc.keyCode} onChange={(v) => up("keyCode", v)} />
          </div>
        </div>

        <div className="mt-6">
          <Area label="Work to be done" rows={6} value={jc.workToBeDone} onChange={(v) => up("workToBeDone", v)} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <LineInput label="Arrival" value={jc.arrivalTime} onChange={(v) => up("arrivalTime", v)} />
            <div>
              <div className="label">Damage codes</div>
              <div className="flex flex-wrap gap-2">
                {BUSINESS.damageCodes.map((c) => (
                  <button key={c.code} type="button" onClick={() => toggleCode(c.code)}
                    className={`chip border ${jc.damageCodes.includes(c.code) ? "border-brand bg-brand/10 text-brand" : "border-steel-200 text-steel-500"}`}>
                    {c.label} ({c.code})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Old parts returned?</span>
              <div className="flex gap-3">
                {(["yes","no"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-sm capitalize">
                    <input type="radio" name="oldparts" checked={jc.oldParts === v} onChange={() => up("oldParts", v)}
                      className="text-brand focus:ring-brand" />{v}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <LineInput label="Departure" value={jc.departureTime} onChange={(v) => up("departureTime", v)} />
            <Area label="Remarks" rows={4} value={jc.remarks} onChange={(v) => up("remarks", v)} />
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="card mt-6 p-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-steel-700">Parts</h2>
        <div className="overflow-hidden rounded-xl border border-steel-200">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase text-steel-400">
              <tr><th className="px-3 py-2 font-medium w-32">Part No.</th><th className="px-3 py-2 font-medium">Description</th><th className="px-3 py-2 font-medium w-32 text-right">Price</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {jc.parts.map((p, i) => (
                <tr key={i} className="border-t border-steel-100">
                  <td className="px-3 py-1.5"><input className="field py-1" value={p.partNo} onChange={(e) => updatePart(i, { partNo: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input className="field py-1" value={p.description} onChange={(e) => updatePart(i, { description: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input className="field py-1 text-right" type="number" step="0.01" value={p.price || ""} onChange={(e) => updatePart(i, { price: parseFloat(e.target.value) || 0 })} /></td>
                  <td className="px-2 text-center"><button className="text-steel-300 hover:text-brand" onClick={() => up("parts", jc.parts.filter((_, j) => j !== i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => up("parts", [...jc.parts, { partNo: "", description: "", price: 0 }])}>+ Add part</button>
          <span className="text-sm text-steel-500">Parts total: <strong className="text-steel-900">{money(partsTotal)}</strong></span>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Area label="Labour" rows={6} value={jc.labour} onChange={(v) => up("labour", v)} />
          <Area label="Report on defects & quote prices" rows={6} value={jc.defectsReport} onChange={(v) => up("defectsReport", v)} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <LineInput label="Hours" value={jc.hours} onChange={(v) => up("hours", v)} />
            <LineInput label="Tech sign" value={jc.techSign} onChange={(v) => up("techSign", v)} />
            <LineInput label="Test drive" value={jc.testDrive} onChange={(v) => up("testDrive", v)} />
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Toggle label="Washed" checked={jc.washed} onChange={(v) => up("washed", v)} />
            <Toggle label="Vacuumed" checked={jc.vacuumed} onChange={(v) => up("vacuumed", v)} />
            <div>
              <span className="label">Book stamped</span>
              <div className="flex gap-3">
                {(["yes","no"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-sm capitalize">
                    <input type="radio" name="bookstamp" checked={jc.bookStamped === v} onChange={() => up("bookStamped", v)} className="text-brand focus:ring-brand" />{v}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save}>
        <DownloadPdfButton document={<JobCardPDF jc={jc} />} filename={`JobCard-${jc.jobCardNo}.pdf`} label="PDF" className="btn-ghost" />
      </SaveBar>
    </div>
  );

  function updatePart(i: number, patch: Partial<PartLine>) {
    if (!jc) return;
    up("parts", jc.parts.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }
}
