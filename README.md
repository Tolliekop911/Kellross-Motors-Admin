# KellRoss Motors — Workshop Admin

Booking → Job Card → Invoice system for **KellRoss Motors CC**, Strand.

- **Public booking form** (`/`) — customers book their vehicle in; each booking lands in the database.
- **Staff admin** (`/admin`, no login) — see bookings, open a **job card** (auto-numbered, continuing from **24145**), fill in everything done, then generate a matching **tax invoice** (auto-numbered from **23230**, 15% VAT).
- **Download PDF** of any job card or invoice — ready to email the customer. Everything is saved in Firestore.

Built with Next.js (App Router) · TypeScript · Tailwind · Firebase (Firestore + Auth) · @react-pdf/renderer.

---

## 1. Create a Firebase project (once)

1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `kellross-motors`).
2. **Build → Firestore Database → Create database** (Production mode, region `europe-west` is fine).
3. **Project settings (gear) → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` values.

> No login: the `/admin` area is open to anyone with the URL. Keep that link private. (To add a password later, enable Firebase Email/Password auth and tighten `firestore.rules`.)

## 2. Connect the app

```bash
cp .env.local.example .env.local
```

Paste your config values into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Set the database security rules

In **Firestore → Rules**, paste the contents of [`firestore.rules`](firestore.rules) and **Publish**.

## 4. Run it

```bash
npm install
npm run dev
```

- Booking form: <http://localhost:3000>
- Staff admin: <http://localhost:3000/admin>

## 5. Deploy (Vercel)

Push to GitHub, import into Vercel, and add the same six `NEXT_PUBLIC_FIREBASE_*` variables in **Vercel → Project → Settings → Environment Variables**. Deploy.

---

## How numbering works

New job cards and invoices auto-increment using a transaction on `counters/sequences`, so numbers never clash. Starting points live in `src/lib/business.ts` (`startingJobCardNo`, `startingInvoiceNo`) — change them there if you want to continue from a different number.

## Changing business details

All letterhead, banking, VAT and terms text is in **`src/lib/business.ts`** — edit once, it updates the whole app and both PDFs.
