/**
 * Hands a reel dropped on the landing page to /upload across the sign-up
 * redirect. File objects can't ride in sessionStorage, but IndexedDB stores
 * them natively. Every call degrades to a no-op where IndexedDB is
 * unavailable (some private-browsing modes) — the athlete just re-picks.
 */

const DB_NAME = "playstyle-finder";
const STORE = "pending-reel";
const KEY = "reel";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const req = op(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function savePendingReel(file: File): Promise<boolean> {
  const ok = await withStore<IDBValidKey>("readwrite", (s) => s.put(file, KEY));
  return ok !== null;
}

export function loadPendingReel(): Promise<File | null> {
  return withStore<File>("readonly", (s) => s.get(KEY));
}

export async function clearPendingReel(): Promise<void> {
  await withStore("readwrite", (s) => s.delete(KEY));
}
