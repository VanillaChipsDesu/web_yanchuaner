export default function AlumniLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-12 bg-slate-950 p-8">
      {/* Grid skeleton */}
      <div className="w-full max-w-6xl space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800"></div>
            <div className="h-4 w-40 animate-pulse rounded-md bg-slate-800/60"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-800"></div>
            <div className="h-10 w-24 animate-pulse rounded-md bg-slate-800"></div>
          </div>
        </div>
        
        {/* Data grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-slate-800"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded-md bg-slate-700"></div>
                    <div className="h-3 w-24 animate-pulse rounded-md bg-slate-800"></div>
                  </div>
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-cyan-900/30 border border-cyan-800/50"></div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="h-3 w-full animate-pulse rounded-md bg-slate-800"></div>
                <div className="h-3 w-4/5 animate-pulse rounded-md bg-slate-800"></div>
                <div className="h-3 w-5/6 animate-pulse rounded-md bg-slate-800"></div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="h-6 w-20 animate-pulse rounded-md bg-slate-800/70"></div>
                <div className="h-6 w-24 animate-pulse rounded-md bg-slate-800/70"></div>
                <div className="h-6 w-16 animate-pulse rounded-md bg-slate-800/70"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
