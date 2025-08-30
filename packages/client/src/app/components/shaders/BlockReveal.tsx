import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

interface BlockRevealProps {
  progress: number; // 0..1 (1 = fully hidden, 0 = fully revealed)
  rows?: number;
  cols?: number;
  seed?: number; // deterministic randomization per Kami
  popDurationMs?: number; // animation duration per block change
}

// Deterministic PRNG (xorshift-ish)
const seedRandom = (seed: number) => {
  let t = Math.max(1, Math.floor(seed)) >>> 0;
  return () => {
    // xorshift32
    t ^= t << 13; t ^= t >>> 17; t ^= t << 5;
    return ((t >>> 0) % 100000) / 100000;
  };
};

export const BlockReveal: React.FC<BlockRevealProps> = ({
  progress,
  rows = 16,
  cols = 16,
  seed = 12345,
  popDurationMs = 220,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const order = useMemo(() => {
    const total = rows * cols;
    const idxs = Array.from({ length: total }, (_, i) => i);
    const rnd = seedRandom(seed);
    // Fisher–Yates shuffle with deterministic RNG
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs;
  }, [rows, cols, seed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const total = rows * cols;
    const toHideCount = Math.max(0, Math.min(total, Math.round(total * progress)));
    // Cells with lower rank remain opaque (hide); others fade out to reveal image
    const opaqueSet = new Set(order.slice(0, toHideCount));
    const cells = Array.from(el.querySelectorAll<HTMLDivElement>('[data-cell]'));
    cells.forEach((cell, idx) => {
      const shouldBeOpaque = opaqueSet.has(idx);
      const current = parseFloat(cell.getAttribute('data-opaque') || '1');
      const next = shouldBeOpaque ? 1 : 0;
      if (current === next) return;
      cell.setAttribute('data-opaque', String(next));
      // CSS transition-based pop
      cell.style.transition = `opacity ${popDurationMs}ms ease-out, transform ${popDurationMs}ms ease-out`;
      cell.style.opacity = String(next);
      // Slight oversize in both axes to avoid 1px seams; collapse height for reveal
      cell.style.transform = next ? 'scale(1.02, 1.06)' : 'scale(1.02, 0)';
    });
  }, [progress, rows, cols, order, popDurationMs]);

  const grid = [] as JSX.Element[];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      grid.push(<Cell key={idx} data-cell data-opaque="1" />);
    }
  }

  return (
    <Cover ref={containerRef} style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {grid}
    </Cover>
  );
};

const Cover = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  gap: 0;
  pointer-events: none;
`;

const Cell = styled.div`
  background:rgb(208, 208, 208); /* match CRT base gray */
  opacity: 0.5;
  transform: scale(1.02, 1.06); /* slight overlap to remove gaps */
  transform-origin: center;
  backface-visibility: hidden;
  will-change: opacity, transform;
`;

export default BlockReveal;


