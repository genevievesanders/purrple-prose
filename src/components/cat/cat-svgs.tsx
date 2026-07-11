/**
 * Hand-drawn-style SVG cat, two poses. Pure presentational — all motion
 * comes from CSS classes defined in globals.css.
 */

const INK = "#3f2a4d"; // deep plum ink
const INK_LIGHT = "#5a3f6e";

export function SleepingCat() {
  return (
    <svg
      width="88"
      height="56"
      viewBox="0 0 88 56"
      fill="none"
      aria-hidden
      className="cat-breathe origin-bottom"
    >
      {/* curled body */}
      <ellipse cx="44" cy="40" rx="30" ry="15" fill={INK} />
      {/* tail wrapped around */}
      <path
        d="M16 44 Q8 40 14 33 Q20 27 30 32"
        stroke={INK_LIGHT}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* head resting on body */}
      <circle cx="60" cy="32" r="13" fill={INK} />
      {/* ears */}
      <path d="M51 24 L49 13 L58 19 Z" fill={INK} />
      <path d="M65 22 L70 12 L72 23 Z" fill={INK} />
      <path d="M52 22 L51 16 L56 20 Z" fill="#8a6aa0" />
      <path d="M66 21 L69 15 L70 21 Z" fill="#8a6aa0" />
      {/* closed eyes */}
      <path
        d="M55 33 Q57 35 59 33"
        stroke="#d9c7e6"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M63 33 Q65 35 67 33"
        stroke="#d9c7e6"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* nose */}
      <circle cx="61" cy="37.5" r="1.4" fill="#c9a3e0" />
    </svg>
  );
}

export function WalkingCat({ walking }: { walking: boolean }) {
  const leg = walking ? "cat-leg" : "";
  const legAlt = walking ? "cat-leg-alt" : "";
  return (
    <svg
      width="96"
      height="64"
      viewBox="0 0 96 64"
      fill="none"
      aria-hidden
      className={walking ? "cat-bob" : ""}
    >
      {/* tail */}
      <path
        d="M78 30 Q90 22 86 12"
        stroke={INK}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        className="cat-tail"
      />
      {/* back legs */}
      <rect x="62" y="40" width="7" height="20" rx="3.5" fill={INK_LIGHT} className={legAlt} />
      <rect x="24" y="40" width="7" height="20" rx="3.5" fill={INK_LIGHT} className={leg} />
      {/* body */}
      <ellipse cx="48" cy="36" rx="30" ry="14" fill={INK} />
      {/* front legs — diagonal gait: legs 1 & 3 move together, 2 & 4 together */}
      <rect x="32" y="40" width="7" height="20" rx="3.5" fill={INK} className={legAlt} />
      <rect x="54" y="40" width="7" height="20" rx="3.5" fill={INK} className={leg} />
      {/* head (facing left) */}
      <circle cx="17" cy="24" r="13" fill={INK} />
      {/* ears */}
      <path d="M8 16 L5 4 L15 10 Z" fill={INK} />
      <path d="M22 14 L27 3 L29 15 Z" fill={INK} />
      <path d="M9 14 L8 8 L13 11 Z" fill="#8a6aa0" />
      <path d="M23 13 L26 7 L27 13 Z" fill="#8a6aa0" />
      {/* eyes open */}
      <circle cx="12" cy="24" r="1.8" fill="#f3e8fa" />
      <circle cx="21" cy="24" r="1.8" fill="#f3e8fa" />
      {/* nose */}
      <circle cx="15.5" cy="29" r="1.4" fill="#c9a3e0" />
      {/* whiskers */}
      <path d="M6 28 L-2 27 M6 31 L-1 33" stroke="#b18ac6" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
