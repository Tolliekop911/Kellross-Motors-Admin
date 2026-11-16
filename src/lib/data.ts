import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { BUSINESS } from "./business";
import type { Booking, JobCard, Invoice } from "./types";

// --- Auto-incrementing numbers (job card / invoice) via a transaction ---
type CounterKey = "jobCardNo" | "invoiceNo";

async function nextNumber(key: CounterKey): Promise<number> {
  const ref = doc(db(), "counters", "sequences");
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const start = key === "jobCardNo" ? BUSINESS.startingJobCardNo : BUSINESS.startingInvoiceNo;
    const current = snap.exists() ? (snap.data()[key] as number | undefined) : undefined;
    const next = current == null ? start : current + 1;
    tx.set(ref, { [key]: next }, { merge: true });
    return next;
  });
}

// --- Bookings ---
export async function createBooking(data: Omit<Booking, "id" | "createdAt" | "status">) {
  const ref = await addDoc(collection(db(), "bookings"), {
    ...data,
    status: "new",
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
  return ref.id;
}

export async function listBookings(): Promise<Booking[]> {
  const q = query(collection(db(), "bookings"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db(), "bookings", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Booking, "id">) }) : null;
}

export async function updateBooking(id: string, patch: Partial<Booking>) {
  await updateDoc(doc(db(), "bookings", id), patch);
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
  const ref = await addDoc(collection(db(), "jobCards"), jc);
  await updateBooking(booking.id, { jobCardId: ref.id, status: "scheduled" });
  return ref.id;
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
  const ref = await addDoc(collection(db(), "jobCards"), jc);
  return ref.id;
}

export async function listJobCards(): Promise<JobCard[]> {
  const q = query(collection(db(), "jobCards"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JobCard, "id">) }));
}

export async function getJobCard(id: string): Promise<JobCard | null> {
  const snap = await getDoc(doc(db(), "jobCards", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<JobCard, "id">) }) : null;
}

export async function saveJobCard(id: string, patch: Partial<JobCard>) {
  await updateDoc(doc(db(), "jobCards", id), { ...patch, updatedAt: Date.now() });
}

export async function deleteJobCard(id: string) {
  await deleteDoc(doc(db(), "jobCards", id));
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
  const ref = await addDoc(collection(db(), "invoices"), inv);
  await saveJobCard(jc.id, { invoiceId: ref.id });
  return ref.id;
}

export async function listInvoices(): Promise<Invoice[]> {
  const q = query(collection(db(), "invoices"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invoice, "id">) }));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(db(), "invoices", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Invoice, "id">) }) : null;
}

export async function saveInvoice(id: string, patch: Partial<Invoice>) {
  await updateDoc(doc(db(), "invoices", id), { ...patch, updatedAt: Date.now() });
}

// --- Totals helper ---
export function invoiceTotals(inv: Pick<Invoice, "lines" | "vatIncluded">) {
  const subtotal = inv.lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (l.each || 0), 0);
  const vat = inv.vatIncluded ? subtotal * BUSINESS.vatRate : 0;
  return { subtotal, vat, total: subtotal + vat };
}
