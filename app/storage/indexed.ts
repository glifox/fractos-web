export class LocalDatabase {
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBDatabase | null>;

  /**
   * Inicializa la conexión a la base de datos.
   * @param dbName Nombre de la base de datos.
   * @param storeName Nombre del almacén de objetos.
   */
  constructor(
    dbName: string = "ByteStoreDB",
    storeName: string = "byteArrays",
  ) {
    this.dbName = dbName;
    this.storeName = storeName;

    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Creamos el almacén de objetos.
          // La llave (keyPath) es el nombre de la cadena.
          db.createObjectStore(this.storeName, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as any).result;
        resolve(db);
      };

      request.onerror = (event) => {
        reject((event.target as any).error);
      };
    });
  }

  public async set(key: string, data: Uint8Array): Promise<void> {
    if (!(data instanceof Uint8Array)) {
      throw new Error("El dato debe ser un Uint8Array.");
    }

    try {
      const db = await this.dbPromise;
      if (!db) { throw new Error("No se pudo establecer la conexión con IndexedDB."); }

      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const arrayBuffer = data.buffer;

      const record = { key: key, data: arrayBuffer };

      const writeRequest = store.put(record);

      await new Promise((resolve, reject) => {
        writeRequest.onsuccess = () => {
          resolve(true);
        };
        writeRequest.onerror = (event) => {
          reject((event.target as any).error);
        };
      });
    } catch (error) {
      console.error( `[ERROR] Fallo al guardar los datos para la llave ${key}:`, error );
      throw error;
    }
  }

  public async get(key: string): Promise<Uint8Array | null> {
    try {
      const db = await this.dbPromise;
      if (!db) {
        throw new Error("No se pudo establecer la conexión con IndexedDB.");
      }

      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(key);

      const result: { data: ArrayBuffer } = await new Promise((resolve, reject) => {
        getRequest.onsuccess = (event) => {
          const result = (event.target as any).result;
          resolve(result);
        };
        getRequest.onerror = (event) => {
          reject((event.target as any).error);
        };
      });

      if (!result || !(result.data instanceof ArrayBuffer)) {
        return null;
      }

      const bytes = new Uint8Array(result.data);
      return bytes;
    } catch (error) {
      return null;
    }
  }
}
