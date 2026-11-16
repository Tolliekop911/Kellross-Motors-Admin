"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import { ConfigNotice } from "./ConfigNotice";
import { Wordmark } from "./Brand";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!firebaseReady) { setReady(true); return; }
    return onAuthStateChanged(auth(), (u) => { setUser(u); setReady(true); });
  }, []);
  return { user, ready };
}

export function signOutUser() {
  if (firebaseReady) signOut(auth());
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!firebaseReady) {
    return <div className="mx-auto max-w-5xl px-5 py-16"><ConfigNotice /></div>;
  }
  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-steel-400">Loading…</div>;
  }
  if (user) return <>{children}</>;

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await signInWithEmailAndPassword(auth(), email, password);
    } catch {
      setError("Incorrect email or password.");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <Wordmark className="text-lg" />
        <h1 className="mt-5 text-xl font-bold text-steel-900">Workshop admin</h1>
        <p className="mb-6 text-sm text-steel-500">Sign in to manage bookings, job cards and invoices.</p>
        <label className="label">Email</label>
        <input className="field mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="label">Password</label>
        <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
