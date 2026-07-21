export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--brand)" />
        <path d="M10 22V10h3v5l4-5h3.5l-4.5 5.5L21 22h-3.7l-4.3-5.2V22H10z" fill="white" />
        <circle cx="24" cy="9" r="3" fill="var(--impact)" />
      </svg>
      <span className="font-bold text-lg tracking-tight">
        Kamba<span className="text-[color:var(--impact)]">Social</span>
      </span>
    </div>
  );
}
