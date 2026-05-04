export class LocalDatabase {
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBDatabase | null>;

  constructor(dbName: string = "ByteStoreDB", storeName: string = "byteArrays") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
      request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  public async set(key: string, data: Uint8Array): Promise<void> {
    if (!(data instanceof Uint8Array)) throw new Error("El dato debe ser un Uint8Array.");

    const db = await this.dbPromise;
    if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      store.put({ key: key, data: data });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  // public async setMany(records: { key: string; data: Uint8Array }[]): Promise<void> {
  //   const db = await this.dbPromise;
  //   if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

  //   return new Promise((resolve, reject) => {
  //     const transaction = db.transaction([this.storeName], "readwrite");
  //     const store = transaction.objectStore(this.storeName);

  //     for (const record of records) {
  //       if (!(record.data instanceof Uint8Array)) {
  //           transaction.abort();
  //           reject(new Error(`El dato para la llave ${record.key} no es un Uint8Array.`));
  //           return;
  //       }
  //       store.put({ key: record.key, data: record.data }); // Store Uint8Array directly
  //     }

  //     transaction.oncomplete = () => resolve();
  //     transaction.onerror = (event) => reject((event.target as IDBRequest).error);
  //   });
  // }

  public async get(key: string): Promise<Uint8Array | null> {
    const db = await this.dbPromise;
    if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(key);

      getRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        // Result is directly returned as Uint8Array
        if (result && result.data instanceof Uint8Array) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
}