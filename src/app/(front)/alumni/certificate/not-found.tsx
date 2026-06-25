import Link from 'next/link';

export default function CertificateNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_40%),linear-gradient(to_bottom,#020617,#0f172a)] px-4 text-slate-100">
      <div className="max-w-xl rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">CERTIFICATE VOID</p>
        <h1 className="mt-3 text-3xl font-semibold text-cyan-100">Orbit Decayed</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">No certificate record was found for this coordinate.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/alumni/radar" className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]">Open Radar</Link>
          <Link href="/" className="rounded-full border border-cyan-300/30 px-5 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]">Return Home</Link>
        </div>
      </div>
    </main>
  );
}
