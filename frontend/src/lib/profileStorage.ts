import type { ResumeProfilePayload } from '../features/analysis/types/analysis.types';

/**
 * Local, browser-only persistence for the user's resume so it does not have to
 * be re-uploaded — or even re-analyzed — on every run. Stored in IndexedDB
 * (which handles Blobs and the 5 MB limit far better than localStorage).
 * Nothing leaves the browser, mirroring the "nothing is stored on our servers"
 * promise on the new-analysis page.
 *
 * Two things are kept:
 *  - `file`: the original resume, used to pre-fill the upload as a fallback.
 *  - `resumeProfile`: the already-analyzed resume returned by the backend, which
 *    lets a new analysis skip file parsing and the resume-extraction LLM call.
 */

const DB_NAME = 'jobfit';
const STORE = 'profile';
const KEY = 'resume';
const DB_VERSION = 1;

export interface SavedProfile {
  file?: File;
  resumeProfile?: ResumeProfilePayload;
  candidateName?: string;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function getProfile(): Promise<SavedProfile | null> {
  try {
    const profile = await withStore<SavedProfile | undefined>('readonly', (store) => store.get(KEY));
    return profile ?? null;
  } catch {
    // A blocked/unavailable IndexedDB should never break the form.
    return null;
  }
}

/** Merges `patch` into the saved profile (read-modify-write), preserving other fields. */
export async function patchProfile(patch: Partial<Omit<SavedProfile, 'savedAt'>>): Promise<void> {
  try {
    const existing = (await getProfile()) ?? { savedAt: 0 };
    const next: SavedProfile = { ...existing, ...patch, savedAt: Date.now() };
    await withStore('readwrite', (store) => store.put(next, KEY));
  } catch {
    // Persisting is best-effort; never block the analysis on a storage error.
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(KEY));
  } catch {
    // Ignore — nothing to clear if storage is unavailable.
  }
}
