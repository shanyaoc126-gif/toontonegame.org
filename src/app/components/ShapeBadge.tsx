'use client';

// Shape glyphs for the color vision assist — the non-color channel of the
// game. One SVG per glyph, drawn in a 20x20 box; ShapeBadge composes one or
// two glyphs (dual glyphs mark hues between two wheel anchors).

import { ShapeId, shapeVertices } from '../lib/calibration';

const INK = '#141412';

function Glyph({ shape, color = INK }: { shape: ShapeId; color?: string }) {
  if (shape === 'circle') {
    return <circle cx={10} cy={10} r={7} fill={color} />;
  }
  if (shape === 'achro') {
    return (
      <>
        <circle cx={10} cy={10} r={7} fill="none" stroke={color} strokeWidth={2} />
        <line x1={4.6} y1={15.4} x2={15.4} y2={4.6} stroke={color} strokeWidth={2} />
      </>
    );
  }
  const pts = shapeVertices(shape, 10, 10, 7.8)
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  return <polygon points={pts} fill={color} />;
}

export function ShapeGlyphIcon({
  shape, size = 20, color = INK,
}: {
  shape: ShapeId; size?: number; color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <Glyph shape={shape} color={color} />
    </svg>
  );
}

export default function ShapeBadge({
  shapes, size = 18, color = INK,
}: {
  shapes: ShapeId[];
  size?: number;   // glyph height in px
  color?: string;
}) {
  const list = shapes.length > 0 ? shapes : ['achro' as ShapeId];
  const slot = 24; // 20px glyph + 4px gap
  const w = list.length * slot - 4;
  const scale = size / 20;
  return (
    <svg
      width={Math.round(w * scale)}
      height={size}
      viewBox={`0 0 ${w} 20`}
      aria-hidden="true"
      focusable="false"
    >
      {list.map((s, i) => (
        <g key={`${s}-${i}`} transform={`translate(${i * slot}, 0)`}>
          <Glyph shape={s} color={color} />
        </g>
      ))}
    </svg>
  );
}
