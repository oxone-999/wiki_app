// SVG gothic creatures for the birthday gate: spiders dangling on threads,
// bats flapping across the screen, and bats hanging upside-down in the corners.
// All motion is CSS-driven (see gothic.css). Counts are "atmospheric".

function BatSVG({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 32" width="48" height="24">
      {/* left wing | body | right wing — wings flap via CSS transform on the groups */}
      <g className="bat-wing bat-wing-l">
        <path d="M32 16 C24 4, 14 6, 2 2 C8 12, 6 16, 12 18 C18 14, 24 18, 32 16 Z" fill="#0b0b10" />
      </g>
      <g className="bat-wing bat-wing-r">
        <path d="M32 16 C40 4, 50 6, 62 2 C56 12, 58 16, 52 18 C46 14, 40 18, 32 16 Z" fill="#0b0b10" />
      </g>
      <ellipse cx="32" cy="16" rx="4" ry="6" fill="#15151c" />
      <path d="M30 9 L29 5 L31 8 Z M34 9 L35 5 L33 8 Z" fill="#15151c" />
    </svg>
  );
}

function SpiderSVG() {
  return (
    <svg viewBox="0 0 40 36" width="36" height="32">
      <line x1="20" y1="-400" x2="20" y2="6" stroke="#6b6b7a" strokeWidth="0.6" />
      <g className="spider-legs" stroke="#0a0a0f" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M16 16 C8 12, 4 16, 1 12" />
        <path d="M16 19 C7 19, 3 23, 0 21" />
        <path d="M16 22 C8 25, 5 30, 1 30" />
        <path d="M16 25 C9 30, 7 34, 3 36" />
        <path d="M24 16 C32 12, 36 16, 39 12" />
        <path d="M24 19 C33 19, 37 23, 40 21" />
        <path d="M24 22 C32 25, 35 30, 39 30" />
        <path d="M24 25 C31 30, 33 34, 37 36" />
      </g>
      <ellipse cx="20" cy="14" rx="6" ry="5" fill="#0a0a0f" />
      <circle cx="20" cy="22" r="8" fill="#0a0a0f" />
      <circle cx="18" cy="13" r="1.1" fill="#c0122f" />
      <circle cx="22" cy="13" r="1.1" fill="#c0122f" />
    </svg>
  );
}

export function Spiders() {
  // A few spiders dropping on threads at different x positions / timings.
  const spiders = [
    { left: '14%', delay: '0s', dur: '7s', drop: 120 },
    { left: '48%', delay: '3.5s', dur: '9s', drop: 80 },
    { left: '82%', delay: '1.8s', dur: '8s', drop: 160 },
  ];
  return (
    <>
      {spiders.map((s, i) => (
        <div
          key={i}
          className="spider"
          style={{
            left: s.left,
            '--drop': `${s.drop}px`,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        >
          <SpiderSVG />
        </div>
      ))}
    </>
  );
}

export function Bats() {
  // Flying bats crossing the screen + 2 hanging in the top corners.
  const fliers = [
    { top: '18%', delay: '0s', dur: '14s', scale: 1 },
    { top: '34%', delay: '5s', dur: '18s', scale: 0.7 },
    { top: '12%', delay: '9s', dur: '12s', scale: 0.85 },
    { top: '52%', delay: '3s', dur: '20s', scale: 0.6 },
  ];
  return (
    <>
      {fliers.map((b, i) => (
        <div
          key={i}
          className="bat-flyer"
          style={{ top: b.top, animationDelay: b.delay, animationDuration: b.dur, transform: `scale(${b.scale})` }}
        >
          <BatSVG className="bat" />
        </div>
      ))}
      <div className="bat-hang bat-hang-l"><BatSVG className="bat" /></div>
      <div className="bat-hang bat-hang-r"><BatSVG className="bat" /></div>
    </>
  );
}
