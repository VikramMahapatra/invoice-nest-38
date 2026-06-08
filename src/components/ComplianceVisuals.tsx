import { useMemo } from "react";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
}

export function QrMock({ value, size = 112, className = "" }: { value: string; size?: number; className?: string }) {
  const cells = useMemo(() => {
    const N = 25;
    const r = rng(hash(value || "x"));
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grid[y][x] = r() > 0.5;
    // Position markers (finder patterns)
    const mark = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const onEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = onEdge || inner;
      }
    };
    mark(0, 0); mark(N - 7, 0); mark(0, N - 7);
    // clear separators
    for (let i = 0; i < 8; i++) {
      if (grid[7] && i < 8) grid[7][i] = false;
      if (grid[i] && grid[i][7] !== undefined) grid[i][7] = false;
      if (grid[N - 8]) grid[N - 8][i] = false;
      if (grid[i]) grid[i][N - 8] = false;
      if (grid[7]) grid[7][N - 1 - i] = false;
    }
    return grid;
  }, [value]);
  const cell = size / cells.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-label="QR code">
      <rect width={size} height={size} fill="#ffffff" />
      {cells.map((row, y) =>
        row.map((on, x) => on ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0b0f19" /> : null)
      )}
    </svg>
  );
}

export function BarcodeMock({ value, height = 56, className = "" }: { value: string; height?: number; className?: string }) {
  const bars = useMemo(() => {
    const r = rng(hash(value || "x"));
    return Array.from({ length: 60 }, () => ({ w: 1 + Math.floor(r() * 4), on: r() > 0.35 }));
  }, [value]);
  const total = bars.reduce((s, b) => s + b.w + 1, 0);
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
        {(() => {
          let x = 0;
          return bars.map((b, i) => {
            const rect = b.on ? <rect key={i} x={x} y={0} width={b.w} height={height} fill="#0b0f19" /> : null;
            x += b.w + 1;
            return rect;
          });
        })()}
      </svg>
      <div className="text-center font-mono text-xs tracking-[0.4em] mt-1 text-zinc-700">{value}</div>
    </div>
  );
}
