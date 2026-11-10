import React, { forwardRef } from 'react';
import { useIndex, useSwipe } from './useIndex.js';

const REACH = 4; // pages rendered on each side of the centre

const CoverflowEffect = forwardRef(function CoverflowEffect(
  { pages, aspect, box, startPage, onPage, onTurn },
  ref
) {
  const [index, go] = useIndex(ref, { count: pages.length, startPage, onPage, onTurn });
  const { handlers } = useSwipe(go, 40);

  const h = Math.min(box.h * 0.82, (box.w * 0.5) / aspect);
  const w = h * aspect;

  const items = [];
  for (let i = Math.max(0, index - REACH); i <= Math.min(pages.length - 1, index + REACH); i++) {
    const d = i - index;
    const side = Math.sign(d);
    const abs = Math.abs(d);
    const x = d === 0 ? 0 : side * (w * 0.62 + (abs - 1) * w * 0.3);
    items.push(
      <div
        className="cf-item"
        key={i}
        onClick={() => d !== 0 && go(i)}
        style={{
          width: w,
          height: h,
          zIndex: 100 - abs,
          opacity: abs === REACH ? 0 : 1,
          transform: `translateX(${x}px) translateZ(${d === 0 ? 0 : -w * 0.45}px) rotateY(${-side * 58}deg)`,
          cursor: d === 0 ? 'default' : 'pointer',
        }}
      >
        <img src={pages[i]} alt={`Page ${i + 1}`} draggable={false} />
      </div>
    );
  }

  return (
    <div className="coverflow" style={{ width: box.w, height: box.h, perspective: Math.max(900, w * 2.4) }} {...handlers}>
      {items}
    </div>
  );
});

export default CoverflowEffect;
