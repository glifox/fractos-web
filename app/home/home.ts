import { LocalDatabase } from "../storage/indexed";
import { LoroDoc, UndoManager, type Subscription } from "loro-crdt";
import { FractosState, FractosView, type ViewMode } from "@glifox/fractos";
import { renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'
import { SideProject } from "../components/web/side-project";
import { downloadContent, startTimer } from "../utils";
import type { NewProjectDialog } from "../components/web/new-project.dialog";
import { Clipboard } from "../keymap/clipboard";
import { Connection } from "@glifox/guitite";

const store = new LocalDatabase();
const chanel = new BroadcastChannel('fractos:updates:ldco');

enum keys {
  updates = "loro-updates",
  session = "session",
  content = "dev-test",
}

const content = store.getMultiple(keys.content, keys.session);
const updates = store.getList('loro-updates');



type Session = {
  host: string,
  user: string,
  pasw: string,
}

class App {
  ldoc = new LoroDoc();
  clipboard = new UndoManager(this.ldoc, {});
  state = new FractosState({ doc: this.ldoc });
  mainView: FractosView | null = null;
  sideView: FractosView | null = null;
  connection: Connection | null = null;

  channelSubscription: Subscription | null = null;

  session: Session | null = null;

  __view: HTMLElement | null = null;
  
  async init() {
    await Promise.all([
      content.then((c) => {
        const snapshot = c.get(keys.content);
        const session = c.get(keys.session);
        if (snapshot) this.ldoc.import(snapshot);
        if (session) {
          this.restoreSession(session);
          this.tryConnect();
        } 
      }),
      updates.then((c) => {
        if (c) {
          this.ldoc.importBatch(c);
          store.set(keys.content, this.ldoc.export({ mode: "snapshot" }))
        }
      }),
    ]);

    document.querySelector('.loader')?.remove();
    
    this.buttons();
    this.side();
    this.main();

    this.ldoc.subscribeLocalUpdates((e) => {
      if (this.connection == null) chanel.postMessage({ updates: e });
      store.append(keys.updates, e);
    })
    
    chanel.onmessage = (evento) => {
      this.ldoc.import(evento.data.updates)
    };
  }
  
  async main() {
    const __view = document.getElementById("view")!;
    this.__view = __view;
    
    const dialog = document.getElementById('new-project--dialog') as NewProjectDialog;
    dialog.init(this.state);

    __view.addEventListener('fractos:view:mode', (event) => {
      // @ts-ignore
      const mode: ViewMode = event.detail;
      
      document.querySelector('.side-project.active')?.classList.remove('active');
      
      if (mode.type === 'selected' && mode.project) {
        const target = document.querySelector(`.side-project[data-treeid="${mode.project}"]`);
        target?.classList.add('active');
      }
    })
    
    console.time("3. creating main view");
    this.mainView = new FractosView({
      state: this.state,
      parent: __view,
      renderer,
      // mode: { type: "none" }
    })
    console.timeEnd("3. creating main view")
  
    const keymap = Keymap.subscribe(this.mainView, this.clipboard);
    const clipboard = Clipboard.subscribe(this.mainView);
    // this.connection.tryconnect()
  }
  
  async side() {
    console.time("4. creating side view")
    
    const __side = document.getElementById("list")!;

    __side.innerHTML = '';
    this.sideView = new FractosView({
      state: this.state,
      parent: __side,
      renderer: {
        task: () => { throw new Error("Unreachable state") },
        project: (_, n) => new SideProject(() => this.mainView, n)
      }
    })
    console.timeEnd("4. creating side view")
  }

  async buttons() {
    const __btImport = document.getElementById('import')! as HTMLButtonElement;
    const __btExport = document.getElementById('export')! as HTMLButtonElement;
    const __import = document.getElementById('input-archivo')! as HTMLInputElement;
    const __loader = document.getElementById('loader')! as HTMLElement;
  
    const __btSave = document.getElementById('save')! as HTMLButtonElement;
    __btSave.addEventListener('click', _ => {
      store.delete(keys.updates).then(_ => {
        store.set(keys.content, this.ldoc.export({ mode: "snapshot" })).then(() => {
          __btSave.innerText = '🚀 Saved!!!!'
          __btSave.disabled = true;
        
          startTimer(() => {
            __btSave.innerText = 'save'
            __btSave.disabled = false;
          }, 300);
        })
      })
    })

    __btExport.addEventListener('click', e => {
      __btExport.disabled = true;
        let content = this.ldoc.export({ mode: "snapshot" })
        downloadContent(content);
        __btExport.disabled = false;
    })

    __btImport.addEventListener('click', _ => {
      __import.click()
      __btImport.disabled = true;
      __loader.showPopover();
    })
    __import.addEventListener('change', e => {
      const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
      
        const archivo = input.files[0];
        const lector = new FileReader();
      
        lector.onload = () => {
          const buffer = lector.result as ArrayBuffer;
          const contenido = new Uint8Array(buffer);
          __btImport.classList.add('success')
          
          this.ldoc.import(contenido);
          
          startTimer(() => {
            __btImport.classList.remove('success')
            __loader.hidePopover()
            __btImport.disabled = false;
          }, 200)
        };
        
        lector.onerror = (error) => {
          console.error("Error al leer el archivo:", error);
          __btImport.classList.add('error')
          
          startTimer(() => {
            __btImport.classList.remove('error')
            __loader.hidePopover()
            __btImport.disabled = false;
          }, 200)
        };
      
        lector.readAsArrayBuffer(archivo!);
    })
    __import.addEventListener('cancel', e => {
      __loader.hidePopover()
      __btImport.disabled = false;
    })
  }

  setSession(session: Session) {
    this.session = session;
    this.saveSession();
    this.tryConnect();
  }

  private saveSession(): Uint8Array {
    const jsonString = JSON.stringify(this.session);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  }

  private restoreSession(data: Uint8Array) {
    const decoder = new TextDecoder();
      const jsonString = decoder.decode(data);
      this.session = JSON.parse(jsonString);
  }

  tryConnect() {
    
  }
}

const app = new App();
app.init()
