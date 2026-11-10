import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

/** Shared page-index state + imperative next/prev/goTo for the non-curl effects. */
export function useIndex(ref, { count, startPage, onPage, onTurn }) {
  const [index, setIndex] = useState(Math.min(startPage, count - 1));
  const cb = useRef({ onPage, onTurn });
  cb.current = { onPage, onTurn };
  const first = useRef(true);

  useEffect(() => {
    cb.current.onPage(index);
    if (first.current) first.current = false;
    else cb.current.onTurn();
  }, [index]);

  const go = useCallback(
    (to) => setIndex((i) => Math.max(0, Math.min(count - 1, typeof to === 'function' ? to(i) : to))),
    [count]
  );

  useImperativeHandle(ref, () => ({
    next: () => go((i) => i + 1),
    prev: () => go((i) => i - 1),
    goTo: (i) => go(i),
  }));

  return [index, go];
}

/** Horizontal swipe: returns pointer handlers and the live drag offset in px. */
export function useSwipe(go, threshold = 60) {
  const start = useRef(null);
  const [dx, setDx] = useState(0);

  const end = (e) => {
    if (start.current === null) return;
    const d = e.clientX - start.current;
    start.current = null;
    setDx(0);
    if (d <= -threshold) go((i) => i + 1);
    else if (d >= threshold) go((i) => i - 1);
  };

  return {
    dx,
    dragging: dx !== 0,
    handlers: {
      onPointerDown: (e) => {
        start.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e) => {
        if (start.current !== null) setDx(e.clientX - start.current);
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
