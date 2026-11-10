// Tiny IndexedDB layer. Books and their rendered page images live in the browser.

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('flipleaf', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('pages');
        db.createObjectStore('files');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let result;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    const out = fn(tx);
    if (out && 'onsuccess' in out) out.onsuccess = () => (result = out.result);
  });
}

const pageKey = (id, i) => `${id}:${String(i).padStart(5, '0')}`;
const pageRange = (id) => IDBKeyRange.bound(`${id}:`, `${id}:￿`);

export const listBooks = async () => {
  const books = await run('books', 'readonly', (tx) => tx.objectStore('books').getAll());
  return books.sort((a, b) => b.createdAt - a.createdAt);
};

export const getBook = (id) => run('books', 'readonly', (tx) => tx.objectStore('books').get(id));

export const saveBook = (book) => run('books', 'readwrite', (tx) => tx.objectStore('books').put(book));

export const savePage = (id, i, blob) =>
  run('pages', 'readwrite', (tx) => tx.objectStore('pages').put(blob, pageKey(id, i)));

export const getPages = (id) =>
  run('pages', 'readonly', (tx) => tx.objectStore('pages').getAll(pageRange(id)));

export const saveFile = (id, file) =>
  run('files', 'readwrite', (tx) => tx.objectStore('files').put(file, id));

export const getFile = (id) => run('files', 'readonly', (tx) => tx.objectStore('files').get(id));

export const deleteBook = (id) =>
  run(['books', 'pages', 'files'], 'readwrite', (tx) => {
    tx.objectStore('books').delete(id);
    tx.objectStore('pages').delete(pageRange(id));
    tx.objectStore('files').delete(id);
  });
