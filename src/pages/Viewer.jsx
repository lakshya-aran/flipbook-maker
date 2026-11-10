import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getBook, getPages, getFile, saveBook } from '../lib/db.js';
import { playFlip } from '../lib/sound.js';
import { EFFECTS, getEffect } from '../effects/index.js';

const BACKGROUNDS = [
  { id: 'slate', label: 'Slate', css: 'radial-gradient(ellipse at 50% 30%, #4b5563 0%, #1f2937 70%)' },
  { id: 'paper', label: 'Paper', css: 'radial-gradient(ellipse at 50% 30%, #f5f1e8 0%, #d9d2c3 80%)' },
  { id: 'night', label: 'Night', css: 'radial-gradient(ellipse at 50% 30%, #1e293b 0%, #020617 75%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(160deg, #0e7490 0%, #1e3a8a 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(160deg, #f59e0b 0%, #be185d 100%)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #3f6212 0%, #134e4a 100%)' },
];

const PAD = 40;
const ZOOMS = [1, 1.5, 2, 3];

export default function Viewer({ bookId }) {
  const [book, setBook] = useState(undefined); // undefined: loading, null: missing
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState(true);
  const [thumbs, setThumbs] = useState(false);
  const [sound, setSound] = useState(true);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const shell = useRef(null);
  const stageEl = useRef(null);
  const effect = useRef(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    let urls = [];
    let dead = false;
    (async () => {
      const b = await getBook(bookId);
      if (dead) return;
      if (!b) return setBook(null);
      const blobs = await getPages(bookId);
      if (dead) return;
      urls = blobs.map((blob) => URL.createObjectURL(blob));
      setPages(urls);
      setBook(b);
    })();
    return () => {
      dead = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [bookId]);

  useEffect(() => {
    const el = stageEl.current;
    if (!el) return;
    let timer;
    // offsetWidth/Height include scrollbars, so a scrollbar appearing never changes the
    // measured size (clientWidth would, causing a resize -> rebuild feedback loop).
    const measure = () =>
      setStage((s) =>
        s.w === el.offsetWidth && s.h === el.offsetHeight ? s : { w: el.offsetWidth, h: el.offsetHeight }
      );
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    });
    ro.observe(el);
    measure();
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [book]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') effect.current?.next();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') effect.current?.prev();
      else if (e.key === 'Home') effect.current?.goTo(0);
      else if (e.key === 'End') effect.current?.goTo(pages.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages.length]);

  const update = (patch) => {
    const next = { ...book, ...patch };
    setBook(next);
    saveBook(next);
  };

  const onTurn = useCallback(() => {
    if (soundRef.current) playFlip();
  }, []);

  const download = async () => {
    const file = await getFile(bookId);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shell.current?.requestFullscreen?.();
  };

  if (book === undefined) return <div className="viewer-msg">Loading…</div>;
  if (book === null)
    return (
      <div className="viewer-msg">
        <p>This flipbook was not found in this browser.</p>
        <a className="btn primary" href="#/">
          Back to library
        </a>
      </div>
    );

  const fx = getEffect(book.effect);
  const Effect = fx.Component;
  const bg = BACKGROUNDS.find((b) => b.id === book.bg) || BACKGROUNDS[0];
  const box = {
    w: Math.max(0, (stage.w - PAD * 2) * zoom),
    h: Math.max(0, (stage.h - PAD * 2) * zoom),
  };
  const last = pages.length - 1;

  return (
    <div className={`viewer ${bg.id === 'paper' ? 'light' : ''}`} ref={shell} style={{ background: bg.css }}>
      <header className="v-top">
        <a className="icon-btn" href="#/" title="Back to library" aria-label="Back to library">
          ←
        </a>
        <input
          className="v-title"
          value={book.title}
          onChange={(e) => update({ title: e.target.value })}
          aria-label="Flipbook title"
        />
        <div className="v-actions">
          <button className={`icon-btn ${panel ? 'on' : ''}`} onClick={() => setPanel(!panel)}>
            Style
          </button>
          <button className="icon-btn" onClick={download}>
            Download PDF
          </button>
        </div>
      </header>

      <div className="v-body">
        {panel && (
          <aside className="v-panel">
            <h3>Page effect</h3>
            <div className="fx-list">
              {EFFECTS.map((e) => (
                <button
                  key={e.id}
                  data-effect={e.id}
                  className={`fx ${e.id === fx.id ? 'active' : ''}`}
                  onClick={() => update({ effect: e.id })}
                >
                  <span className={`fx-icon fx-${e.id}`} />
                  <span>
                    <strong>{e.label}</strong>
                    <small>{e.hint}</small>
                  </span>
                </button>
              ))}
            </div>
            <h3>Background</h3>
            <div className="bg-list">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  className={`bg ${b.id === bg.id ? 'active' : ''}`}
                  style={{ background: b.css }}
                  onClick={() => update({ bg: b.id })}
                  title={b.label}
                  aria-label={`${b.label} background`}
                />
              ))}
            </div>
          </aside>
        )}

        <div className="v-stage" ref={stageEl}>
          {stage.w > 0 && pages.length > 0 && (
            <div className="v-stage-inner" style={{ width: box.w, height: box.h, margin: 'auto', padding: PAD, boxSizing: 'content-box' }}>
              <Effect
                key={fx.Component === getEffect('magazine').Component ? 'flip' : fx.id}
                ref={effect}
                mode={fx.id}
                pages={pages}
                aspect={book.aspect}
                box={box}
                startPage={page}
                onPage={setPage}
                onTurn={onTurn}
              />
            </div>
          )}
          <button className="nav prev" onClick={() => effect.current?.prev()} disabled={page <= 0} aria-label="Previous page">
            ‹
          </button>
          <button className="nav next" onClick={() => effect.current?.next()} disabled={page >= last} aria-label="Next page">
            ›
          </button>
        </div>
      </div>

      {thumbs && (
        <div className="v-thumbs">
          {pages.map((url, i) => (
            <button
              key={i}
              className={i === page ? 'active' : ''}
              onClick={() => effect.current?.goTo(i)}
              aria-label={`Go to page ${i + 1}`}
            >
              <img src={url} loading="lazy" alt="" style={{ aspectRatio: book.aspect }} />
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      <footer className="v-bar">
        <button className={`icon-btn ${thumbs ? 'on' : ''}`} onClick={() => setThumbs(!thumbs)}>
          Pages
        </button>
        <div className="v-pager">
          <button className="icon-btn" onClick={() => effect.current?.goTo(0)} disabled={page <= 0} aria-label="First page">
            «
          </button>
          <input
            type="number"
            min={1}
            max={pages.length}
            value={page + 1}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= pages.length) effect.current?.goTo(n - 1);
            }}
            aria-label="Current page"
          />
          <span>/ {pages.length}</span>
          <button className="icon-btn" onClick={() => effect.current?.goTo(last)} disabled={page >= last} aria-label="Last page">
            »
          </button>
        </div>
        <div className="v-actions">
          <button
            className="icon-btn"
            onClick={() => setZoom(ZOOMS[(ZOOMS.indexOf(zoom) + 1) % ZOOMS.length])}
            title="Cycle zoom"
          >
            Zoom {zoom}×
          </button>
          <button className={`icon-btn ${sound ? 'on' : ''}`} onClick={() => setSound(!sound)}>
            Sound {sound ? 'on' : 'off'}
          </button>
          <button className="icon-btn" onClick={fullscreen}>
            Fullscreen
          </button>
        </div>
      </footer>
    </div>
  );
}
