/** IndexedDB helpers for images (reference + generated). App-scoped DB name. */

const DB_NAME = "caj_aprender_jugar_v1";
const DB_VERSION = 1;
const STORE = "images";

/** Fixed key for the Config-screen reference image (JPEG data URL). */
export const REF_IMAGE_KEY = "reference_image";

function msgKey(messageId: string): string {
  return "msg:" + messageId;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () =>
      reject(req.error ?? new Error("No se pudo abrir IndexedDB"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const v = req.result;
        resolve(typeof v === "string" && v ? v : null);
      };
    });
  } finally {
    db.close();
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbDeletePrefix(prefix: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.openCursor();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const key = String(cursor.key);
        if (key.startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadReferenceImage(): Promise<string | null> {
  try {
    return await idbGet(REF_IMAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveReferenceImage(dataUrl: string): Promise<void> {
  await idbSet(REF_IMAGE_KEY, dataUrl);
}

export async function clearReferenceImage(): Promise<void> {
  try {
    await idbDelete(REF_IMAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function saveMessageImage(
  messageId: string,
  dataUrl: string,
): Promise<void> {
  await idbSet(msgKey(messageId), dataUrl);
}

export async function loadMessageImage(
  messageId: string,
): Promise<string | null> {
  try {
    return await idbGet(msgKey(messageId));
  } catch {
    return null;
  }
}

export async function deleteMessageImage(messageId: string): Promise<void> {
  try {
    await idbDelete(msgKey(messageId));
  } catch {
    /* ignore */
  }
}

export async function clearAllMessageImages(): Promise<void> {
  try {
    await idbDeletePrefix("msg:");
  } catch {
    /* ignore */
  }
}
