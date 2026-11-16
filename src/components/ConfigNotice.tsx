export function ConfigNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Firebase not connected yet</p>
      <p className="mt-1 text-amber-800">
        Copy <code className="rounded bg-amber-100 px-1">.env.local.example</code> to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> and paste your Firebase web
        config, then restart the dev server. Setup steps are in{" "}
        <code className="rounded bg-amber-100 px-1">README.md</code>.
      </p>
    </div>
  );
}
