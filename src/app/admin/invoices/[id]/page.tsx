"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getInvoice, saveInvoice, invoiceTotals } from "@/lib/data";
import { BUSINESS, money } from "@/lib/business";
import type { Invoice, InvoiceLine } from "@/lib/types";
import { LineInput, Toggle, SaveBar } from "@/components/fields";
import { DownloadPdfButton } from "@/components/pdf/DownloadButton";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

export default function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getInvoice(id).then((d) => (d ? setInv(d) : setNotFound(true)));
  }, [id]);

  function up<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInv((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }
  function updateLine(i: number, patch: Partial<InvoiceLine>) {
    if (!inv) return;
    up("lines", inv.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  async function save() {
    if (!inv) return;
    setSaving(true);
    const { id: _id, ...patch } = inv;
    await saveInvoice(id, patch);
    setSaving(false); setDirty(false);
  }

  if (notFound) return <p className="text-center text-steel-400">Invoice not found. <Link className="text-brand" href="/admin">Back</Link></p>;
  if (!inv) return <p className="text-center text-steel-400">Loading…</p>;

  const t = invoiceTotals(inv);

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/admin?tab=invoices" className="text-sm text-steel-400 hover:text-steel-600">← Invoices</Link>
        <div className="flex items-center gap-2">
          {inv.jobCardId && <Link className="btn-ghost" href={`/admin/jobcards/${inv.jobCardId}`}>Job card</Link>}
          <DownloadPdfButton document={<InvoicePDF inv={inv} />} filename={`Invoice-${inv.invoiceNo}.pdf`} label="Download PDF" />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between border-b border-steel-200 pb-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Kell<span className="text-brand">Ross</span> Motors CC</h1>
            <p className="text-xs text-steel-500">Reg {BUSINESS.reg} · VAT {BUSINESS.vat}</p>
            <p className="text-xs text-steel-500">{BUSINESS.address} · Tel {BUSINESS.tel} · Cell {BUSINESS.cell}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wide text-steel-500">Tax Invoice No.</div>
            <div className="font-mono text-2xl font-bold text-brand">{inv.invoiceNo}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <LineInput label="Customer" value={inv.customer} onChange={(v) => up("customer", v)} />
            <LineInput label="Postal Address" value={inv.postalAddress} onChange={(v) => up("postalAddress", v)} />
            <LineInput label="Telephone" value={inv.telephone} onChange={(v) => up("telephone", v)} />
            <LineInput label="Fax" value={inv.fax} onChange={(v) => up("fax", v)} />
            <LineInput label="Vehicle" value={inv.vehicleDetail} onChange={(v) => up("vehicleDetail", v)} />
          </div>
          <div className="space-y-2">
            <LineInput label="Date" type="date" value={inv.date} onChange={(v) => up("date", v)} />
            <LineInput label="Cust Order No" value={inv.customerOrderNo} onChange={(v) => up("customerOrderNo", v)} />
            <LineInput label="Service Call No" value={inv.serviceCallNo} onChange={(v) => up("serviceCallNo", v)} />
            <LineInput label="Contact" value={inv.contact} onChange={(v) => up("contact", v)} />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-steel-200">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase text-steel-400">
              <tr>
                <th className="px-3 py-2 font-medium w-20">Qty</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium w-28 text-right">Each</th>
                <th className="px-3 py-2 font-medium w-28 text-right">Total</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i} className="border-t border-steel-100">
                  <td className="px-3 py-1.5"><input className="field py-1" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input className="field py-1" value={l.item} onChange={(e) => updateLine(i, { item: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input className="field py-1 text-right" type="number" step="0.01" value={l.each || ""} onChange={(e) => updateLine(i, { each: parseFloat(e.target.value) || 0 })} /></td>
                  <td className="px-3 py-1.5 text-right font-medium text-steel-700">{money((Number(l.quantity) || 0) * (l.each || 0))}</td>
                  <td className="px-2 text-center"><button className="text-steel-300 hover:text-brand" onClick={() => up("lines", inv.lines.filter((_, j) => j !== i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-ghost mt-2 px-3 py-1.5 text-xs" onClick={() => up("lines", [...inv.lines, { quantity: "1", item: "", each: 0 }])}>+ Add line</button>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="text-xs text-steel-500">
            <div className="font-semibold text-steel-700">Banking Details</div>
            <div>{BUSINESS.banking.name} · {BUSINESS.banking.bank}</div>
            <div>Branch {BUSINESS.banking.branch} · Acc {BUSINESS.banking.account}</div>
          </div>
          <div className="w-full max-w-xs space-y-1 text-sm">
            <Row label="Sub total" value={money(t.subtotal)} />
            <div className="flex items-center justify-between">
              <Toggle label={`VAT (${BUSINESS.vatRate * 100}%)`} checked={inv.vatIncluded} onChange={(v) => up("vatIncluded", v)} />
              <span>{money(t.vat)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-steel-200 pt-1 text-base font-bold">
              <span>Total</span><span>{money(t.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save}>
        <DownloadPdfButton document={<InvoicePDF inv={inv} />} filename={`Invoice-${inv.invoiceNo}.pdf`} label="PDF" className="btn-ghost" />
      </SaveBar>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-steel-600"><span>{label}</span><span>{value}</span></div>;
}
