export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      {/* Radar pulse animation */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full border-2 border-[#7C3AED]/20" />
        <div className="absolute inset-2 animate-ping rounded-full border-2 border-[#7C3AED]/30" style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-4 animate-ping rounded-full border-2 border-[#7C3AED]/40" style={{ animationDelay: '0.6s' }} />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/40">
          <div className="h-3 w-3 rounded-full bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.6)]" />
        </div>
      </div>
      <p className="mt-6 animate-pulse text-lg font-medium tracking-wider text-[#7C3AED]/70">
        Establishing Command Link...
      </p>
      <p className="mt-2 text-sm text-[#4C1D95]/60">正在建立控制链路</p>
    </div>
  );
}
