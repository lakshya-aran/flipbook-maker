import React, { forwardRef } from 'react';
import { useIndex, useSwipe } from './useIndex.js';

const DEPTH = 4; // cards visible under the top one

const CardsEffect = forwardRef(function CardsEffect({ pages, aspect, box, startPage, onPage, onTurn }, ref) {
  const [index, go] = useIndex(ref, { count: pages.length, startPage, onPage, onTurn });
  const { dx, dragging, handlers } = useSwipe(go);

  const h = Math.min(box.h * 0.9, (box.w * 0.9) / aspect);
  const w = h * aspect;

  const cards = [];
  for (let i = Math.max(0, index - 2); i <= Math.min(pages.length - 1, index + DEPTH); i++) {
    const d = i - index;
    let style;
    if (d < 0) {
      // already dealt: thrown off to the left
      style = {
        transform: `translate(${-box.w * 0.6 - w / 2}px, ${-20}px) rotate(-14deg)`,
        opacity: 0,
        zIndex: 100 + i,
        pointerEvents: 'none',
      };
    } else {
      const drag = d === 0 ? dx : 0;
      style = {
        transform: `translate(${d * 12 + drag}px, ${d * 9}px) scale(${1 - d * 0.035}) rotate(${
          d === 0 ? drag / 40 : d % 2 ? 1.2 : -1.2
        }deg)`,
        opacity: d === DEPTH ? 0 : 1,
        zIndex: 50 - d,
        transition: d === 0 && dragging ? 'none' : undefined,
      };
    }
    cards.push(
      <div className="card" key={i} style={{ width: w, height: h, ...style }}>
        <img src={pages[i]} alt={`Page ${i + 1}`} draggable={false} />
      </div>
    );
  }

  return (
    <div className="cards" style={{ width: box.w, height: box.h }} {...handlers}>
      {cards}
    </div>
  );
});

export default CardsEffect;
