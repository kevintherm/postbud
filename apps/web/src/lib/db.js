const DB_NAME = 'postbud_db';
const DB_VERSION = 1;

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('environments')) {
        db.createObjectStore('environments', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getMeta(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

export async function setMeta(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearMeta(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCollections() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readonly');
    const store = tx.objectStore('collections');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCollection(collection) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readwrite');
    const store = tx.objectStore('collections');
    const req = store.put(collection);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCollection(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readwrite');
    const store = tx.objectStore('collections');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getEnvironments() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('environments', 'readonly');
    const store = tx.objectStore('environments');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEnvironment(environment) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('environments', 'readwrite');
    const store = tx.objectStore('environments');
    const req = store.put(environment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteEnvironment(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('environments', 'readwrite');
    const store = tx.objectStore('environments');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getHistory() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      resolve(list.sort((a, b) => b.timestamp - a.timestamp));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveHistoryEntry(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteHistoryEntry(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearHistory() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
