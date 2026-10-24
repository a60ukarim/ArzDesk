import { emptyState, localStateSchema, type LocalState } from "./model";
const DB = "arzdesk-device-v1";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("data");
    request.onerror = () =>
      reject(
        new Error(
          "Device storage is unavailable. Allow site storage and try again.",
        ),
      );
    request.onblocked = () =>
      reject(new Error("Close other ArzDesk tabs and try again."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
// One read/write transaction serializes writes from every open tab. No stale state is written back.
export async function deviceTransaction(
  change?: (state: LocalState) => LocalState,
): Promise<LocalState> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("data", change ? "readwrite" : "readonly");
    const store = tx.objectStore("data");
    const request = store.get("state");
    let result: LocalState;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        const current =
          request.result === undefined
            ? emptyState()
            : localStateSchema.parse(request.result);
        result = change ? change(current) : current;
        if (change) store.put(result, "state");
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        failure ??
          new Error(
            "Changes could not be saved. Device storage may be full. Export a backup before clearing anything.",
          ),
      );
    };
  });
}
