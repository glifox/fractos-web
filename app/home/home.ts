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
import type { StatusButton } from "../components/web/status-button";

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
  file: string,
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
  __status: StatusButton = document.getElementById("session-btn") as StatusButton;
  __logout: HTMLButtonElement = document.getElementById('logout') as HTMLButtonElement;
  
  async init() {
    document.addEventListener('guitite:status-changed', (e) => {
      const detail = (e as CustomEvent).detail! as {
        status: string,
        context: { code: number, reason: string } | null,
      }

      this.__logout.classList.remove('hide');
      if (detail.status === 'connected') {
        this.__status.changeState('success', 'connected');
        return
      }
      
      if (detail.status === 'connecting') {
        this.__status.changeState('warning', 'connecting')
        return
      }

      if (detail.context) {
        if (detail.context.reason === 'Self killed') {
          this.__status.changeState('muted', 'offline')
          return
        }
        this.__status.changeState('warning', detail.context.reason);
        return
      }

      if (detail.status === 'disconnected') {
        this.__status.changeState('error', 'disconnected');
        return
      }
    })
    
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

    this.setSessionPopover()
    this.buttons();
    this.side();
    this.main();
    
    document.querySelector('.loader')?.remove();

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

  buttons() {
    const __btImport = document.getElementById('import')! as HTMLButtonElement;
    const __btExport = document.getElementById('export')! as HTMLButtonElement;
    const __import = document.getElementById('input-archivo')! as HTMLInputElement;
    const __loader = document.getElementById('loader')! as HTMLElement;
  
    const __btSave = document.getElementById('save')! as HTMLButtonElement;
    __btSave.addEventListener('click', async _ => {
      await store.delete(keys.updates);
      await store.set(keys.content, this.ldoc.export({ mode: "snapshot" }));
      
      __btSave.innerText = '🚀 Saved!!!!';
      __btSave.disabled = true;
      
      startTimer(() => {
        __btSave.innerText = 'save';
        __btSave.disabled = false;
      }, 300);
    });

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

    this.__logout.addEventListener('click', _ => {
      this.connection?.close()
      this.connection = null;
      
      this.session = null;
      store.delete(keys.session);
      
      this.__logout.classList.add('hide');
    })
  }

  setSession(session: Session) {
    this.session = session;
    this.saveSession();
    this.tryConnect();
  }

  private saveSession() {
    const jsonString = JSON.stringify(this.session);
    const encoder = new TextEncoder();
    const encodedSession = encoder.encode(jsonString);
    store.set(keys.session, encodedSession)
  }

  private restoreSession(data: Uint8Array) {
    const decoder = new TextDecoder();
      const jsonString = decoder.decode(data);
      this.session = JSON.parse(jsonString);
  }

  tryConnect() {
    if (this.session == null) return;
    this.connection = new Connection(
      `https://${this.session.host}/ws/${this.session.file}`,
      {
        doc: this.ldoc,
        protocols: [ `Auth-${this.session.user}-${this.session.pasw}` ]
      }
    )

    this.connection.tryconnect()
  }

  private setSessionPopover() {
    const username = document.getElementById('username') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const host = document.getElementById('host') as HTMLInputElement;
    const file = document.getElementById('file') as HTMLInputElement;

    const validate = (input: HTMLInputElement) => {
      const value = input.value; 

      if (value.length < 1) {
        input.classList.add('error');
        input.addEventListener('keydown', _ => input.classList.remove('error'))
        return null;
      }

      return value;
    }
    
    document.getElementById('login-cancel')?.addEventListener('click', () => {
      document.getElementById('session')?.hidePopover()
    })
    
    document.getElementById('login')?.addEventListener('click', () => {
      const username_value = validate(username);
      const password_value = validate(password);
      const host_value = validate(host);
      const file_value = validate(file);
      
      if (username_value == null) return;
      if (password_value == null) return;
      if (host_value == null) return;
      if (file_value == null) return;
      
      this.setSession({
        file: file_value,
        host: host_value,
        pasw: password_value,
        user: username_value,
      })
      
      document.getElementById('session')?.hidePopover();
      password.value = ''
    })
  }
}

const app = new App();
app.init()
