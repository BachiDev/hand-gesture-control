/**
 * Minimal two-finger victory mark (lucide ships no peace-hand icon).
 * Same 24-grid, stroke style, and className contract as Lucide icons.
 */
export default function VictoryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8 2.5 11 11" />
      <path d="M16 2.5 13 11" />
      <rect x="7" y="11" width="10" height="9" rx="4" />
    </svg>
  );
}
