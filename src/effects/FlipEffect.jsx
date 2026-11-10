import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';

/**
 * Page-curl effects built on page-flip: magazine, book, album, notebook, onepage.
 * `mode` picks the variant; the rest of the props are the shared effect contract.
 */
const FlipEffect = forwardRef(function FlipEffect(
  { pages, aspect, box, mode, startPage, onPage, onTurn },
  ref
) {
  const mount = useRef(null);
  const flip = useRef(null);
  const current = useRef(startPage);
  const cb = useRef({ onPage, onTurn });
  cb.current = { onPage, onTurn };
  // -1: closed on the front cover, 1: closed on the back cover, 0: open
  const [shift, setShift] = useState(0);

  const single = mode === 'onepage';
  const dims = useMemo(() => {
    const h = Math.min(box.h, box.w / ((single ? 1 : 2) * aspect));
    return { w: Math.floor(h * aspect), h: Math.floor(h) };
  }, [box.w, box.h, aspect, single]);

  useEffect(() => {
    if (dims.w < 40 || !pages.length) return;
    const n = pages.length;

    const root = document.createElement('div');
    root.className = `flip-root flip-${mode}`;
    root.style.width = `${single ? dims.w : dims.w * 2}px`;
    mount.current.appendChild(root);

    const els = pages.map((url, i) => {
      const el = document.createElement('div');
      el.className = 'flip-page';
      const hard = mode === 'album' || (mode === 'book' && (i === 0 || i === n - 1));
      if (hard) el.dataset.density = 'hard';
      const img = document.createElement('img');
      img.src = url;
      img.alt = `Page ${i + 1}`;
      img.draggable = false;
      el.appendChild(img);
      root.appendChild(el);
      return el;
    });

    const pf = new PageFlip(root, {
      width: dims.w,
      height: dims.h,
      size: 'fixed',
      showCover: !single,
      usePortrait: single,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      flippingTime: mode === 'album' ? 950 : 800,
      startPage: Math.min(current.current, n - 1),
      mobileScrollSupport: false,
    });
    pf.loadFromHTML(els);
    flip.current = pf;
    // showCover forces hard first/last pages; only book and album want that.
    if (mode === 'magazine' || mode === 'notebook') {
      pf.getPage(0)?.setDensity('soft');
      pf.getPage(n - 1)?.setDensity('soft');
    }

    const settle = () => {
      const i = pf.getCurrentPageIndex();
      current.current = i;
      cb.current.onPage(i);
      if (single) return setShift(0);
      setShift(i === 0 ? -1 : n % 2 === 0 && i === n - 1 ? 1 : 0);
    };
    pf.on('flip', settle);
    pf.on('changeState', (e) => {
      if (e.data === 'flipping') {
        setShift(0);
        cb.current.onTurn();
      } else if (e.data === 'read') {
        settle();
      }
    });
    settle();

    return () => {
      flip.current = null;
      try {
        pf.destroy();
      } catch {
        /* already torn down */
      }
      root.remove();
    };
  }, [pages, dims.w, dims.h, mode, single]);

  useImperativeHandle(ref, () => ({
    next: () => flip.current?.flipNext(),
    prev: () => flip.current?.flipPrev(),
    goTo: (i) => flip.current?.flip(i),
  }));

  const spreadW = single ? dims.w : dims.w * 2;
  const rings = mode === 'notebook' ? Math.max(4, Math.floor(dims.h / 26)) : 0;

  return (
    <div className="flip-host">
      <div
        className="flip-shifter"
        style={{ width: spreadW, height: dims.h, transform: `translateX(${(shift * dims.w) / 2}px)` }}
      >
        {mode === 'book' && (
          <div
            className="book-board"
            style={{ left: shift === -1 ? dims.w - 8 : -8, right: shift === 1 ? dims.w - 8 : -8 }}
          />
        )}
        <div ref={mount} className="flip-mount" />
        {rings > 0 && (
          <div className="rings" aria-hidden="true">
            {Array.from({ length: rings }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default FlipEffect;
