import Link from "next/link";
import { BUSINESS } from "@/lib/business";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Kell<span className="text-brand">Ross</span> Motors{" "}
      <span className="font-semibold text-steel-400">CC</span>
    </span>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-steel-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Wordmark className="text-xl" />
        </Link>
        <div className="hidden text-right text-xs leading-tight text-steel-500 sm:block">
          <div>{BUSINESS.address}</div>
          <div>
            Tel {BUSINESS.tel} · {BUSINESS.email}
          </div>
        </div>
      </div>
    </header>
  );
}
