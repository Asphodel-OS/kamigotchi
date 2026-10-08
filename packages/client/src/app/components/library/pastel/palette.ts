// shared look for the co-op modal: game ink + borders, pastel fills
export const Palette = {
  ink: '#222',
  muted: '#666',
  faint: '#999',
  line: '#d9d4c7',
  soft: '#f7f5ef',
  paper: '#fff',
  community: { bg: '#e4f2ff', edge: '#36a6ff' },
  progress: { fill: '#a3e3b8', edge: '#3f8f5a', track: '#f1efe8' },
  button: { bg: '#c9ecd3', hover: '#b3e3c1', disabled: '#ecebe6' },
  info: { bg: '#e1efff', hover: '#cfe4fd' },
  neutral: { bg: '#efeee9', edge: '#bdb8aa' },
};

const TierColors: Record<string, { bg: string; edge: string }> = {
  bronze: { bg: '#f7e4d3', edge: '#c48b5c' },
  silver: { bg: '#ebeef3', edge: '#8e98ab' },
  gold: { bg: '#fbeebb', edge: '#c9a227' },
};

export const getTierColors = (name: string) =>
  TierColors[name.toLowerCase()] ?? { bg: Palette.soft, edge: Palette.faint };

export const formatFull = (n: number) => Math.floor(Number(n) || 0).toLocaleString('en-US');

export const formatCompact = (n: number) => {
  const v = Number(n) || 0;
  const fmt = (x: number) => `${Number.isInteger(x) ? x : +x.toFixed(1)}`;
  if (v >= 1e6) return `${fmt(v / 1e6)}M`;
  if (v >= 1e3) return `${fmt(v / 1e3)}k`;
  return `${v}`;
};

const KEEP_CAPS = ['MUSU', 'ONYX', 'ETH', 'VIPP'];

// "REPUTATION" -> "Reputation"; token names and mixed-case names pass through
export const prettyName = (name: string) =>
  name === name.toUpperCase() && !KEEP_CAPS.includes(name)
    ? name.charAt(0) + name.slice(1).toLowerCase()
    : name;
