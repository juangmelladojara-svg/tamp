"use client";

export default function ErrorPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-white p-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Algo falló</h1>
      <p className="mt-2 text-ink-500">{error.message || "No se pudo completar la acción."}</p>
      {error.digest && <p className="mt-1 font-mono text-xs text-ink-400">Ref: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-700"
      >
        Reintentar
      </button>
    </div>
  );
}
