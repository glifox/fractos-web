export class LocalDatabase {
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBDatabase | null>;

  // Nuevas propiedades para manejar el buffer en memoria
  private pendingUpdates = new Map<string, Uint8Array[]>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private nextFlushPromise: Promise<void> | null = null;
  private nextFlushResolve: (() => void) | null = null;
  private nextFlushReject: ((error: any) => void) | null = null;

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

  public async get(key: string): Promise<Uint8Array | null> {
    const db = await this.dbPromise;
    if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(key);

      getRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result && result.data instanceof Uint8Array) resolve(result.data);
        else resolve(null);
      };
      getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async append(key: string, data: Uint8Array): Promise<void> {
    if (!(data instanceof Uint8Array)) throw new Error("El dato debe ser un Uint8Array.");

    if (!this.pendingUpdates.has(key)) {
      this.pendingUpdates.set(key, []);
    }
    this.pendingUpdates.get(key)!.push(data);

    if (!this.nextFlushPromise) {
      this.nextFlushPromise = new Promise((resolve, reject) => {
        this.nextFlushResolve = resolve;
        this.nextFlushReject = reject;
      });
      
      this.flushTimer = setTimeout(() => this.flush(), 150); 
    }

    return this.nextFlushPromise;
  }

  private async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const updatesToProcess = this.pendingUpdates;
    this.pendingUpdates = new Map();

    const resolve = this.nextFlushResolve;
    const reject = this.nextFlushReject;

    this.nextFlushPromise = null;
    this.nextFlushResolve = null;
    this.nextFlushReject = null;

    if (updatesToProcess.size === 0) {
      if (resolve) resolve();
      return;
    }

    try {
      const db = await this.dbPromise;
      if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

      return new Promise((res, rej) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Iterar sobre cada llave en el buffer
        updatesToProcess.forEach((newItems, key) => {
          const getRequest = store.get(key);
          
          getRequest.onsuccess = (e) => {
            const result = (e.target as IDBRequest).result;
            let currentList: Uint8Array[] = [];

            if (result && Array.isArray(result.data)) {
              currentList = result.data;
            } else if (result && result.data instanceof Uint8Array) {
              currentList = [result.data];
            }

            // Unimos el historial con todos los micro-updates guardados en memoria
            const mergedList = currentList.concat(newItems);
            store.put({ key: key, data: mergedList });
          };
        });

        transaction.oncomplete = () => {
          if (resolve) resolve(); // Resuelve las promesas originales de append()
          res();
        };
        
        transaction.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          if (reject) reject(error);
          rej(error);
        };
      });
    } catch (error) {
      if (reject) reject(error);
    }
  }

  public async getList(key: string): Promise<Uint8Array[]> {
    await this.flush();

    const db = await this.dbPromise;
    if (!db) throw new Error("No se pudo establecer la conexión con IndexedDB.");

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(key);

      getRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        let listToReturn: Uint8Array[] = [];
        
        if (result && Array.isArray(result.data)) {
          listToReturn = result.data;
        } else if (result && result.data instanceof Uint8Array) {
          listToReturn = [result.data];
        }

        // Si encontramos datos, borramos la llave inmediatamente
        if (listToReturn.length > 0) {
          store.delete(key);
        }
        
        resolve(listToReturn);
      };
      
      getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async getMultiple<K extends string>(...keys: K[]): Promise<Map<K, Uint8Array | null>> {
      const db = await this.dbPromise;
      if (!db) throw new Error("Could not establish connection to IndexedDB.");
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const results = new Map<K, Uint8Array | null>();
        let pendingRequests = keys.length;
  
        if (pendingRequests === 0) {
          resolve(results);
          return;
        }
  
        keys.forEach((key) => {
          const getRequest = store.get(key);
  
          getRequest.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            
            if (result && result.data instanceof Uint8Array) {
              results.set(key, result.data);
            } else {
              results.set(key, null);
            }
  
            pendingRequests--;
            // Resolve the main promise when all requests finish
            if (pendingRequests === 0) resolve(results);
          };
  
          getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
        });
      });
    }
  
    public async getMultipleLists<K extends string>(...keys: K[]): Promise<Map<K, Uint8Array[]>> {
      // Force flush to guarantee memory updates are saved to disk
      await this.flush();
  
      const db = await this.dbPromise;
      if (!db) throw new Error("Could not establish connection to IndexedDB.");
  
      return new Promise((resolve, reject) => {
        // Use 'readwrite' to allow deletion after reading the lists
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const results = new Map<K, Uint8Array[]>();
        let pendingRequests = keys.length;
  
        if (pendingRequests === 0) {
          resolve(results);
          return;
        }
  
        keys.forEach((key) => {
          const getRequest = store.get(key);
  
          getRequest.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            let listToReturn: Uint8Array[] = [];
  
            if (result && Array.isArray(result.data)) {
              listToReturn = result.data;
            } else if (result && result.data instanceof Uint8Array) {
              listToReturn = [result.data];
            }
  
            results.set(key, listToReturn);
  
            // Delete the key if it contained data, just like the single getList
            if (listToReturn.length > 0) {
              store.delete(key);
            }
  
            pendingRequests--;
            // Resolve the main promise when all requests finish
            if (pendingRequests === 0) resolve(results);
          };
  
          getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
        });
      });
    }

    public async delete(...keys: string[]): Promise<void> {
      keys.forEach(key => this.pendingUpdates.delete(key));
  
      await this.flush();
  
      const db = await this.dbPromise;
      if (!db) throw new Error("Could not establish connection to IndexedDB.");
  
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        keys.forEach((key) => {
          store.delete(key);
        });
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject((event.target as IDBRequest).error);
      });
    }
}