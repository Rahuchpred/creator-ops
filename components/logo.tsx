// The brand mark: a branching shape with a loose dot. Redrawn by hand from
// the owner's logo image, so it is a close stand-in until the original
// vector file is dropped in.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 285 308" aria-hidden="true" className={className}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M35 90 Q122 100 142 28" />
        <path d="M35 217 Q122 205 142 280" />
        <path d="M128 100 L128 206" />
        <path d="M134 152 Q236 126 250 217" />
      </g>
      <circle cx="250" cy="90" r="25" fill="currentColor" />
    </svg>
  );
}
