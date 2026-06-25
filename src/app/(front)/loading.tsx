export default function Loading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-8 bg-[#FAF5FF] text-[#4C1D95]">
      <div className="relative flex items-center justify-center">
        {/* Pulse circles */}
        <div className="absolute h-32 w-32 animate-ping rounded-full border border-[#7C3AED]/30"></div>
        <div className="absolute h-48 w-48 animate-ping rounded-full border border-[#A78BFA]/20" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute h-64 w-64 animate-ping rounded-full border border-[#7C3AED]/10" style={{ animationDelay: '1s' }}></div>
        
        {/* Core icon */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] shadow-[0_0_30px_rgba(124,58,237,0.3)]">
          <svg className="h-8 w-8 animate-spin text-white" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v20m0-20L9.5 5.5M12 2l2.5 3.5M12 22l-2.5-3.5M12 22l2.5-3.5M2 12h20m-20 0l3.5-2.5M2 12l3.5 2.5M22 12l-3.5-2.5M22 12l-3.5-2.5" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <h3 className="animate-pulse text-xl font-medium tracking-widest text-[#7C3AED] uppercase font-heading">Loading</h3>
        <p className="text-sm tracking-wider text-[#4C1D95]/60">正在加载页面内容...</p>
        <div className="mt-4 flex space-x-1">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C3AED]" style={{ animationDelay: '0s' }}></div>
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A78BFA]" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7C3AED]/60" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
