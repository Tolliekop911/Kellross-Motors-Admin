import {
  ref,
  push,
  set,
  update,
  get,
  remove,
  query,
  orderByChild,
  runTransaction,
} from "firebase/database";
import { rtdb } from "./firebase";
import { BUSINESS } from "./business";
import type { Booking, JobCard, Invoice } from "./types";

// --- Auto-incrementing numbers (job card / invoice) via a transaction ---
type CounterKey = "jobCardNo" | "invoiceNo";

async function nextNumber(key: CounterKey): Promise<number> {
  const start = key === "jobCardNo" ? BUSINESS.startingJobCardNo : BUSINESS.startingInvoiceNo;
  const res = await runTransaction(ref(rtdb(), `counters/${key}`), (current: number | null) =>
    current == null ? start : current + 1
  );
  return res.snapshot.val() as number;
}

// Read a list node ordered by createdAt (newest first).
async function listOrdered<T>(path: string): Promise<(T & { id: string })[]> {
  const snap = await get(query(ref(rtdb(), path), orderByChild("createdAt")));
  const rows: (T & { id: string })[] = [];
  snap.forEach((child) => {
    rows.push({ id: child.key as string, ...(child.val() as T) });
  });
  return rows.reverse();
}

async function getOne<T>(path: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await get(ref(rtdb(), `${path}/${id}`));
  return snap.exists() ? ({ id, ...(snap.val() as T) }) : null;
}

// --- Settings: daily booking limit ---
export async function getMaxPerDay(): Promise<number> {
  try {
    const snap = await get(ref(rtdb(), "settings/maxBookingsPerDay"));
    const v = snap.val();
    return typeof v === "number" && v > 0 ? v : BUSINESS.defaultMaxBookingsPerDay;
  } catch {
    // settings node not readable yet (rules not published) — fall back to default.
    return BUSINESS.defaultMaxBookingsPerDay;
  }
}
export async function setMaxPerDay(n: number) {
  await set(ref(rtdb(), "settings/maxBookingsPerDay"), Math.max(1, Math.round(n)));
}

/** How many (non-cancelled) vehicles are already booked in on a given date. */
export async function countBookingsOnDate(date: string): Promise<number> {
  if (!date) return 0;
  const all = await listBookings();
  return all.filter((b) => b.preferredDate === date && b.status !== "cancelled").length;
}

/** Bulk-import existing (paper) appointments as bookings. Returns how many were added. */
export interface ImportRow {
  date?: string; name?: string; phone?: string; email?: string;
  make?: string; model?: string; registration?: string; service?: string; notes?: string;
}
export async function importBookings(rows: ImportRow[]): Promise<number> {
  let count = 0;
  for (const r of rows) {
    if (!r.name && !r.registration && !r.date) continue; // skip empty lines
    const rref = push(ref(rtdb(), "bookings"));
    await set(rref, {
      name: r.name ?? "", email: r.email ?? "", tel: "", cell: r.phone ?? "", address: "",
      make: r.make ?? "", model: r.model ?? "", registration: r.registration ?? "", km: "",
      service: r.service || "Service", preferredDate: r.date ?? "", notes: r.notes ?? "",
      status: "scheduled", createdAt: Date.now(),
    });
    count++;
  }
  return count;
}

// --- Bookings ---
export async function createBooking(data: Omit<Booking, "id" | "createdAt" | "status">) {
  const r = push(ref(rtdb(), "bookings"));
  await set(r, { ...data, status: "new", createdAt: Date.now() });
  return r.key as string;
}

export function listBookings() {
  return listOrdered<Omit<Booking, "id">>("bookings");
}
export function getBooking(id: string) {
  return getOne<Omit<Booking, "id">>("bookings", id);
}
export async function updateBooking(id: string, patch: Partial<Booking>) {
  await update(ref(rtdb(), `bookings/${id}`), patch);
}
export async function deleteBooking(id: string) {
  await remove(ref(rtdb(), `bookings/${id}`));
}

// --- Job cards ---
export async function createJobCardFromBooking(booking: Booking): Promise<string> {
  const jobCardNo = await nextNumber("jobCardNo");
  const now = Date.now();
  const jc: Omit<JobCard, "id"> = {
    jobCardNo,
    createdAt: now,
    updatedAt: now,
    bookingId: booking.id,
    name: booking.name,
    address: booking.address,
    tel: booking.tel,
    cell: booking.cell,
    email: booking.email,
    methodOfPayment: "",
    date: booking.preferredDate || new Date().toISOString().slice(0, 10),
    model: [booking.make, booking.model].filter(Boolean).join(" "),
    registration: booking.registration,
    km: booking.km,
    vin: "",
    fabNo: "",
    radioCode: "",
    keyCode: "",
    workToBeDone: booking.service + (booking.notes ? `\n${booking.notes}` : ""),
    arrivalTime: "",
    departureTime: "",
    remarks: "",
    damageCodes: [],
    oldParts: "",
    parts: [],
    labour: "",
    defectsReport: "",
    hours: "",
    techSign: "",
    testDrive: "",
    washed: false,
    vacuumed: false,
    bookStamped: "",
  };
  const r = push(ref(rtdb(), "jobCards"));
  await set(r, jc);
  await updateBooking(booking.id, { jobCardId: r.key as string, status: "scheduled" });
  return r.key as string;
}

export async function createBlankJobCard(): Promise<string> {
  const jobCardNo = await nextNumber("jobCardNo");
  const now = Date.now();
  const jc: Omit<JobCard, "id"> = {
    jobCardNo,
    createdAt: now,
    updatedAt: now,
    name: "", address: "", tel: "", cell: "", email: "", methodOfPayment: "",
    date: new Date().toISOString().slice(0, 10),
    model: "", registration: "", km: "", vin: "", fabNo: "", radioCode: "", keyCode: "",
    workToBeDone: "", arrivalTime: "", departureTime: "", remarks: "",
    damageCodes: [], oldParts: "", parts: [], labour: "", defectsReport: "",
    hours: "", techSign: "", testDrive: "", washed: false, vacuumed: false, bookStamped: "",
  };
  const r = push(ref(rtdb(), "jobCards"));
  await set(r, jc);
  return r.key as string;
}

// Realtime Database omits empty arrays, so re-hydrate them on read.
function fixJobCard<T extends Partial<JobCard>>(jc: T): T {
  return { ...jc, parts: jc.parts ?? [], damageCodes: jc.damageCodes ?? [] };
}

export async function listJobCards() {
  const rows = await listOrdered<Omit<JobCard, "id">>("jobCards");
  return rows.map(fixJobCard);
}
export async function getJobCard(id: string) {
  const jc = await getOne<Omit<JobCard, "id">>("jobCards", id);
  return jc ? fixJobCard(jc) : null;
}
export async function saveJobCard(id: string, patch: Partial<JobCard>) {
  await update(ref(rtdb(), `jobCards/${id}`), { ...patch, updatedAt: Date.now() });
}
export async function deleteJobCard(jc: JobCard) {
  await remove(ref(rtdb(), `jobCards/${jc.id}`));
  // Free the booking so it can be turned into a job card again.
  if (jc.bookingId) await update(ref(rtdb(), `bookings/${jc.bookingId}`), { jobCardId: null, status: "new" });
  // Detach any invoice created from it (the invoice itself is kept).
  if (jc.invoiceId) await update(ref(rtdb(), `invoices/${jc.invoiceId}`), { jobCardId: null });
}

// --- Invoices ---
export async function createInvoiceFromJobCard(jc: JobCard): Promise<string> {
  const invoiceNo = await nextNumber("invoiceNo");
  const now = Date.now();
  const inv: Omit<Invoice, "id"> = {
    invoiceNo,
    createdAt: now,
    updatedAt: now,
    jobCardId: jc.id,
    customer: jc.name,
    postalAddress: jc.address,
    telephone: jc.tel || jc.cell,
    fax: "",
    vehicleDetail: [jc.model, jc.registration].filter(Boolean).join(" — "),
    date: new Date().toISOString().slice(0, 10),
    customerOrderNo: "",
    serviceCallNo: String(jc.jobCardNo),
    contact: jc.name,
    lines: [
      ...jc.parts
        .filter((p) => p.description || p.price)
        .map((p) => ({ quantity: "1", item: p.description || p.partNo, each: p.price || 0 })),
      ...(jc.labour.trim() ? [{ quantity: "1", item: `Labour: ${jc.labour.trim()}`, each: 0 }] : []),
    ],
    vatIncluded: true,
  };
  const r = push(ref(rtdb(), "invoices"));
  await set(r, inv);
  await saveJobCard(jc.id, { invoiceId: r.key as string });
  return r.key as string;
}

export async function createBlankInvoice(): Promise<string> {
  const invoiceNo = await nextNumber("invoiceNo");
  const now = Date.now();
  const inv: Omit<Invoice, "id"> = {
    invoiceNo,
    createdAt: now,
    updatedAt: now,
    customer: "", postalAddress: "", telephone: "", fax: "", vehicleDetail: "",
    date: new Date().toISOString().slice(0, 10),
    customerOrderNo: "", serviceCallNo: "", contact: "",
    lines: [{ quantity: "1", item: "", each: 0 }],
    vatIncluded: true,
  };
  const r = push(ref(rtdb(), "invoices"));
  await set(r, inv);
  return r.key as string;
}

function fixInvoice<T extends Partial<Invoice>>(inv: T): T {
  return { ...inv, lines: inv.lines ?? [] };
}

export async function listInvoices() {
  const rows = await listOrdered<Omit<Invoice, "id">>("invoices");
  return rows.map(fixInvoice);
}
export async function getInvoice(id: string) {
  const inv = await getOne<Omit<Invoice, "id">>("invoices", id);
  return inv ? fixInvoice(inv) : null;
}
export async function saveInvoice(id: string, patch: Partial<Invoice>) {
  await update(ref(rtdb(), `invoices/${id}`), { ...patch, updatedAt: Date.now() });
}
export async function deleteInvoice(inv: Invoice) {
  await remove(ref(rtdb(), `invoices/${inv.id}`));
  // Mark the originating job card as no longer invoiced.
  if (inv.jobCardId) await update(ref(rtdb(), `jobCards/${inv.jobCardId}`), { invoiceId: null });
}

// --- Totals helper ---
export function invoiceTotals(inv: Pick<Invoice, "lines" | "vatIncluded">) {
  const subtotal = inv.lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (l.each || 0), 0);
  const vat = inv.vatIncluded ? subtotal * BUSINESS.vatRate : 0;
  return { subtotal, vat, total: subtotal + vat };
}
