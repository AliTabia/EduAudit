import React from 'react'

/**
 * ESPRIT SVG Logo
 * Replicates the official ESPRIT wordmark with the play-arrow accent,
 * tagline "Se former autrement" and "HONORIS UNITED UNIVERSITIES".
 */
export default function EspritLogo({ variant = 'dark', height = 48 }) {
  const textColor = variant === 'white' ? '#ffffff' : '#ffffff'
  const scale = height / 80

  return (
    <svg
      width={Math.round(240 * scale)}
      height={height}
      viewBox="0 0 240 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ESPRIT — Se former autrement"
    >
      {/* Red background pill */}
      <rect width="240" height="80" rx="6" fill="#D01012"/>

      {/* "esprit" wordmark */}
      <text
        x="20" y="42"
        fontSize="34" fontWeight="800"
        fontFamily="'Inter','Arial Black',sans-serif"
        fill="white"
        letterSpacing="-1"
      >esprit</text>

      {/* Play-arrow accent after "esprit" */}
      <polygon points="178,18 190,30 178,42" fill="white"/>

      {/* Tagline */}
      <text
        x="22" y="56"
        fontSize="9" fontWeight="400"
        fontFamily="'Inter','Arial',sans-serif"
        fill="white"
        letterSpacing="0.3"
      >Se former autrement</text>

      {/* Separator line */}
      <line x1="20" y1="62" x2="220" y2="62" stroke="white" strokeWidth="0.6" opacity="0.6"/>

      {/* Honoris */}
      <text
        x="20" y="74"
        fontSize="7.5" fontWeight="600"
        fontFamily="'Inter','Arial',sans-serif"
        fill="white"
        letterSpacing="2"
      >HONORIS UNITED UNIVERSITIES</text>
    </svg>
  )
}

/** Compact icon-only version (square red badge) */
export function EspritIcon({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.22),
      background: '#D01012',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.72} height={size * 0.5} viewBox="0 0 52 36" fill="none">
        <text x="0" y="26" fontSize="22" fontWeight="800"
          fontFamily="'Inter','Arial Black',sans-serif" fill="white">
          esprit
        </text>
        <polygon points="46,6 54,14 46,22" fill="white"/>
      </svg>
    </div>
  )
}
