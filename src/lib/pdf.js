import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { saveBook, savePage, saveFile, deleteBook } from './db.js';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const TARGET_HEIGHT = 1600; // px, rendered page height
const MAX_SCALE = 3;

const toBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode page image'))), type, quality)
  );

/**
 * Renders every page of a PDF to a JPEG and stores the result as a new book.
 * onProgress(done, total) is called after each page.
 */
export async function importPdf(file, onProgress = () => {}) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  try {
    const total = pdf.numPages;
    let aspect = 0.707;
    let cover = null;
    onProgress(0, total);

    for (let n = 1; n <= total; n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(MAX_SCALE, TARGET_HEIGHT / base.height);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const blob = await toBlob(canvas, 'image/jpeg', 0.9);
      await savePage(id, n - 1, blob);

      if (n === 1) {
        aspect = canvas.width / canvas.height;
        const thumb = document.createElement('canvas');
        thumb.height = 480;
        thumb.width = Math.round(480 * aspect);
        thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
        cover = await toBlob(thumb, 'image/jpeg', 0.85);
      }

      page.cleanup();
      canvas.width = canvas.height = 0;
      onProgress(n, total);
    }

    await saveFile(id, file);
    const book = {
      id,
      title: file.name.replace(/\.pdf$/i, ''),
      pageCount: total,
      aspect,
      cover,
      effect: 'magazine',
      bg: 'slate',
      createdAt: Date.now(),
    };
    await saveBook(book);
    return book;
  } catch (err) {
    await deleteBook(id).catch(() => {});
    throw err;
  } finally {
    pdf.destroy();
  }
}
