"use client";

export function ImagePlaceholder({ className = "", label, gradient = "violet" }) {
  const gradients = {
    violet: "from-violet-600/30 via-fuchsia-500/20 to-cyan-500/25",
    slate: "from-slate-700/40 via-slate-600/20 to-zinc-500/25",
    warm: "from-amber-500/25 via-orange-500/15 to-rose-500/20",
  };
  const g = gradients[gradient] || gradients.violet;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${g} ${className}`}
      role="img"
      aria-label={label || "Placeholder image"}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {label ? (
        <span className="absolute bottom-3 left-3 right-3 text-xs font-medium tracking-wide text-white/80 drop-shadow-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
