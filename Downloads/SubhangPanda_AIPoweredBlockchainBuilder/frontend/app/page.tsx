import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#0c4a6e_0%,#020617_55%)] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.08),transparent_45%)]" />

      <div className="relative z-10 max-w-lg text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
          On-chain predictions
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          Prophet Zero
        </h1>
        <p className="mx-auto mt-6 text-lg leading-relaxed text-zinc-300">
          A simple place to bet ETH on future outcomes. When the oracle picks a
          winner, the pool pays people who guessed right.
        </p>
        <Link
          href="/markets"
          className="mt-10 inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-cyan-400 to-emerald-400 px-8 py-3.5 text-base font-semibold text-zinc-950 shadow-lg shadow-cyan-950/40 transition hover:opacity-95"
        >
          Open markets
        </Link>
      </div>
    </div>
  );
}
