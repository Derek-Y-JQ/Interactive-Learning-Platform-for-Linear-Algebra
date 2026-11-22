/**
 * Single source of truth for colours used inside SVG / WebGL figures.
 * CSS side mirrors these values in index.css (@theme). Keep both in sync.
 */
export const C = {
  paper: '#F7F5F0',
  surface: '#FFFFFF',
  sunken: '#EFECE5',
  ink: '#1B2230',
  ink2: '#464F5E',
  ink3: '#646B78',
  rule: '#DDD8CE',
  ruleStrong: '#BDB6A8',
  grid: '#E9E5DC',
  gridMajor: '#D6D0C3',
  axis: '#5B6270',

  primary: '#1E3A5F',
  accent: '#B45309',

  // Figure palette (print-safe, distinguishable under common colour-vision deficiencies)
  blue: '#1F5FA8',
  red: '#C2410C',
  green: '#2E7D4F',
  violet: '#6D4BA8',
  ochre: '#A16207',
  gray: '#8A8F98',
} as const;

/** THREE.js wants numeric colours */
export const hex = (c: string): number => parseInt(c.replace('#', ''), 16);
