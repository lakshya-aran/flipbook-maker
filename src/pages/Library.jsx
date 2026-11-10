import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listBooks, deleteBook } from '../lib/db.js';
import { importPdf } from '../lib/pdf.js';

function Cover({ blob, title }) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url ? <img src={url} alt={title} /> : <div className="cover-blank" />;
}

export default function Library() {
  const [books, setBooks] = useState(null);
  const [job, setJob] = useState(null); // { name, done, total }
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef(null);

  const refresh = () => listBooks().then(setBooks);
  useEffect(() => {
    refresh();
  }, []);

  const upload = async (file) => {
    if (!file || job) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setError('That file is not a PDF.');
      return;
    }
    setError('');
    setJob({ name: file.name, done: 0, total: 0 });
    try {
      const book = await importPdf(file, (done, total) => setJob({ name: file.name, done, total }));
      window.location.hash = `#/book/${book.id}`;
    } catch (err) {
      console.error(err);
      setError(
        err?.name === 'PasswordException'
          ? 'This PDF is password-protected. Remove the password and try again.'
          : `Could not read that PDF: ${err?.message || err}`
      );
      setJob(null);
    }
  };

  const remove = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    await deleteBook(book.id);
    refresh();
  };

  const pct = job?.total ? Math.round((job.done / job.total) * 100) : 0;

  return (
    <div className="library">
      <header className="lib-header">
        <div className="brand">
          <span className="brand-mark" />
          Flipleaf
        </div>
        <button className="btn primary" onClick={() => input.current.click()} disabled={!!job}>
          Upload PDF
        </button>
      </header>

      <main className="lib-main">
        <h1>Turn a PDF into a flipbook</h1>
        <p className="lead">
          Drop a PDF and it becomes a page-turning book with eight effects: magazine, book, album,
          notebook, slider, cards, coverflow and one page.
        </p>

        <div
          className={`dropzone ${over ? 'over' : ''} ${job ? 'busy' : ''}`}
          onClick={() => !job && input.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            upload(e.dataTransfer.files[0]);
          }}
        >
          {job ? (
            <>
              <strong>Converting {job.name}</strong>
              <span>{job.total ? `Page ${job.done} of ${job.total}` : 'Opening PDF…'}</span>
              <div className="progress">
                <div style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <>
              <strong>Drop your PDF here</strong>
              <span>or click to choose a file</span>
            </>
          )}
          <input
            ref={input}
            id="pdf-input"
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              upload(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </div>
        {error && <p className="error">{error}</p>}

        {books?.length > 0 && (
          <>
            <h2>Your flipbooks</h2>
            <div className="book-grid">
              {books.map((b) => (
                <div className="book-card" key={b.id}>
                  <a href={`#/book/${b.id}`} className="book-cover">
                    <Cover blob={b.cover} title={b.title} />
                  </a>
                  <div className="book-meta">
                    <a href={`#/book/${b.id}`} title={b.title}>
                      {b.title}
                    </a>
                    <span>
                      {b.pageCount} {b.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                  <button className="book-del" onClick={() => remove(b)} title="Delete flipbook" aria-label={`Delete ${b.title}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
