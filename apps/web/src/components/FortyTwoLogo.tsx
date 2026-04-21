export function FortyTwoLogo({ className = 'forty-two-logo' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 137.5 96.5"
      role="img"
      aria-label="42"
      focusable="false"
    >
      <polygon points="76,0 50.7,0 0,50.7 0,71.2 50.7,71.2 50.7,96.5 76,96.5 76,50.7 25.3,50.7" />
      <polygon points="86.9,25.3 112.2,0 86.9,0" />
      <polygon points="137.5,25.3 137.5,0 112.2,0 112.2,25.3 86.9,50.7 86.9,76 112.2,76 112.2,50.7" />
      <polygon points="137.5,50.7 112.2,76 137.5,76" />
    </svg>
  )
}
