/** Virtfit mark: a V (the fit) circled by the ring, with a pink dot where the front style stands. */
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="logo-mark">
      <path d="M9 8.5 16 23l7-14.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="16" cy="16" rx="14" ry="5.6" transform="rotate(-24 16 16)" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".55" />
      <circle cx="27.6" cy="10.4" r="2.6" fill="#ff2e93" />
    </svg>
  )
}
