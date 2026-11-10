# Flipleaf

Turn any PDF into a page-turning flipbook, right in your browser.

**Live demo:** https://lakshya-aran.github.io/flipbook-maker/

Drop in a PDF and Flipleaf renders each page into an interactive book you can flip through with realistic page-turn animations. Everything runs on the client side — no server, no uploads. Your books stay in your browser's storage.

## Features

- **PDF to flipbook** — drag and drop a PDF (or click to choose one) and watch it convert page by page with a progress bar
- **8 page effects**
  | Effect | Description |
  | --- | --- |
  | Magazine | Soft pages that curl as they turn |
  | Book | Hard cover with soft inner pages |
  | Album | Rigid board pages |
  | Notebook | Spiral-bound spread |
  | Slider | Pages slide side to side |
  | Cards | A stack you deal through |
  | Coverflow | 3D carousel of pages |
  | One page | Single page with a curl |
- **6 backgrounds** — Slate, Paper, Night, Ocean, Sunset, Forest
- **Library** — all your flipbooks with cover thumbnails, page counts and delete
- **Viewer controls** — page thumbnails, jump to page, zoom (1×, 1.5×, 2×, 3×), fullscreen, editable title and download of the original PDF
- **Page-turn sound** — synthesised with the Web Audio API (no audio files), can be muted
- **Keyboard navigation** — see below
- **Works offline after load** — books are saved in IndexedDB, so they're still there when you come back

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `→` / `Page Down` | Next page |
| `←` / `Page Up` | Previous page |
| `Home` | First page |
| `End` | Last page |

## Tech stack

- [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) to render PDF pages to images
- [page-flip](https://github.com/Nodlik/StPageFlip) for the flip animations
- IndexedDB for local storage

## Getting started

You'll need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/lakshya-aran/flipbook-maker.git
cd flipbook-maker
npm install
npm run dev
```

Then open http://localhost:5180.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 5180 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build on port 5180 |

## How it works

1. **Import** — `src/lib/pdf.js` reads the PDF with pdf.js and renders every page to a canvas at about 1600px tall, then saves it as a JPEG. The first page is also saved as a small cover thumbnail.
2. **Store** — `src/lib/db.js` keeps the book details, page images and original PDF in IndexedDB (`books`, `pages` and `files` stores).
3. **View** — `src/pages/Viewer.jsx` loads the page images and hands them to the chosen effect component in `src/effects/`.

## Project structure

```
src/
├── App.jsx            # Hash routing: library (#/) and viewer (#/book/:id)
├── main.jsx           # React entry point
├── styles.css
├── pages/
│   ├── Library.jsx    # Upload + list of flipbooks
│   └── Viewer.jsx     # Flipbook reader with controls
├── effects/
│   ├── index.js       # Effect registry
│   ├── FlipEffect.jsx # Magazine, book, album, notebook, one page
│   ├── SliderEffect.jsx
│   ├── CardsEffect.jsx
│   ├── CoverflowEffect.jsx
│   └── useIndex.js    # Shared page-index hook
└── lib/
    ├── pdf.js         # PDF → page images
    ├── db.js          # IndexedDB helpers
    └── sound.js       # Page-turn sound
```

## Notes

- Password-protected PDFs aren't supported. Remove the password first.
- Books are stored only in the browser you used. Clearing site data deletes them.
