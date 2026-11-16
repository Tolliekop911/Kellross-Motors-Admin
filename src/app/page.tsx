"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/Brand";
import { ConfigNotice } from "@/components/ConfigNotice";
import { firebaseReady } from "@/lib/firebase";
import { createBooking, getMaxPerDay, countBookingsOnDate } from "@/lib/data";
import { BUSINESS } from "@/lib/business";

const SERVICES = [
  "General Service",
  "Major Service",
  "Brakes",
  "Clutch",
  "Engine Diagnostics",
  "Suspension / Steering",
  "Aircon / Electrical",
  "Roadworthy / Pre-purchase check",
  "Other",
];

const empty = {
  name: "", email: "", tel: "", cell: "", address: "",
  make: "", model: "", registration: "", km: "",
  service: SERVICES[0], preferredDate: "", notes: "",
};

export default function BookingPage() {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [day, setDay] = useState<{ full: boolean; remaining: number } | null>(null);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Check how full the chosen day is.
  useEffect(() => {
    if (!firebaseReady || !form.preferredDate) { setDay(null); return; }
    let active = true;
    setDay(null);
    Promise.all([getMaxPerDay(), countBookingsOnDate(form.preferredDate)])
      .then(([max, count]) => { if (active) setDay({ full: count >= max, remaining: Math.max(0, max - count) }); })
      .catch(() => { if (active) setDay(null); });
    return () => { active = false; };
  }, [form.preferredDate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (day?.full) { setError("That day is fully booked — please choose another date."); return; }
    setSending(true);
    try {
      // Re-check at submit time in case the day filled up meanwhile.
      const [max, count] = await Promise.all([getMaxPerDay(), countBookingsOnDate(form.preferredDate)]);
      if (form.preferredDate && count >= max) {
        setDay({ full: true, remaining: 0 });
        setError("That day just became fully booked — please choose another date.");
        return;
      }
      await createBooking(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us instead.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-steel-200 bg-ink text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            Strand · Gants Centre
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Book your vehicle in with KellRoss Motors.
          </h1>
          <p className="mt-3 max-w-xl text-steel-300">
            Honest workmanship, genuine parts, one-year guarantee. Fill in the form below and we&apos;ll
            confirm your booking.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-10">
        {done ? (
          <div className="mx-auto max-w-xl card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h2 className="mt-4 text-xl font-bold">Booking received</h2>
            <p className="mt-2 text-steel-600">
              Thanks {form.name.split(" ")[0] || "there"} — we&apos;ve got your request for a{" "}
              <strong>{form.service.toLowerCase()}</strong>. We&apos;ll be in touch to confirm the date.
            </p>
            <p className="mt-4 text-sm text-steel-500">
              Need us sooner? Call <strong>{BUSINESS.tel}</strong>.
            </p>
            <button className="btn-ghost mt-6" onClick={() => { setForm(empty); setDone(false); }}>
              Make another booking
            </button>
          </div>
        ) : !firebaseReady ? (
          <ConfigNotice />
        ) : (
          <form onSubmit={submit} className="grid gap-6">
            <Section title="Your details">
              <Grid>
                <Input label="Full name" value={form.name} onChange={set("name")} required />
                <Input label="Email" type="email" value={form.email} onChange={set("email")} />
                <Input label="Telephone" value={form.tel} onChange={set("tel")} />
                <Input label="Cellphone" value={form.cell} onChange={set("cell")} required />
                <Input label="Address" value={form.address} onChange={set("address")} wide />
              </Grid>
            </Section>

            <Section title="Your vehicle">
              <Grid>
                <Input label="Make" value={form.make} onChange={set("make")} placeholder="e.g. Toyota" />
                <Input label="Model" value={form.model} onChange={set("model")} placeholder="e.g. Hilux 2.4" />
                <Input label="Registration" value={form.registration} onChange={set("registration")} required />
                <Input label="Current km" value={form.km} onChange={set("km")} />
              </Grid>
            </Section>

            <Section title="What do you need?">
              <Grid>
                <div>
                  <label className="label">Service</label>
                  <select className="field" value={form.service} onChange={set("service")}>
                    {SERVICES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Input label="Preferred date" type="date" value={form.preferredDate} onChange={set("preferredDate")}
                    min={new Date().toISOString().slice(0, 10)} />
                  {day && (
                    day.full
                      ? <p className="mt-1 text-xs font-medium text-brand">Fully booked — please choose another day.</p>
                      : <p className="mt-1 text-xs font-medium text-emerald-600">
                          {day.remaining} slot{day.remaining === 1 ? "" : "s"} available this day.
                        </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Describe the problem / notes</label>
                  <textarea className="field min-h-[96px]" value={form.notes} onChange={set("notes")}
                    placeholder="Any noises, warning lights, or specific requests…" />
                </div>
              </Grid>
            </Section>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="flex items-center justify-between">
              <Link href="/admin" className="text-sm font-medium text-steel-400 hover:text-steel-600">
                Staff login →
              </Link>
              <button type="submit" className="btn-primary" disabled={sending || day?.full}>
                {sending ? "Sending…" : day?.full ? "Day fully booked" : "Request booking"}
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="mx-auto max-w-screen-2xl px-6 lg:px-10 pb-10 text-xs text-steel-400">
        {BUSINESS.name} · Reg {BUSINESS.reg} · VAT {BUSINESS.vat} · {BUSINESS.address}
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-steel-700">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Input({
  label, wide, ...props
}: { label: string; wide?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      <input className="field" {...props} />
    </div>
  );
}
