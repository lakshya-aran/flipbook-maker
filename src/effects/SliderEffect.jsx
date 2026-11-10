import React, { forwardRef } from 'react';
import { useIndex, useSwipe } from './useIndex.js';

const SliderEffect = forwardRef(function SliderEffect({ pages, aspect, box, startPage, onPage, onTurn }, ref) {
  const [index, go] = useIndex(ref, { count: pages.length, startPage, onPage, onTurn });
  const { dx, dragging, handlers } = useSwipe(go);

  const h = Math.min(box.h, box.w / aspect);
  const w = h * aspect;

  return (
    <div className="slider" style={{ width: box.w, height: box.h }} {...handlers}>
      <div
        className="slider-track"
        style={{
          transform: `translateX(${-index * box.w + dx}px)`,
          transition: dragging ? 'none' : undefined,
        }}
      >
        {pages.map((url, i) => (
          <div className="slider-slide" key={i} style={{ width: box.w, height: box.h }}>
            {Math.abs(i - index) <= 2 && (
              <img src={url} alt={`Page ${i + 1}`} draggable={false} style={{ width: w, height: h }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default SliderEffect;
