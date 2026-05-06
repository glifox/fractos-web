import { LocalDatabase } from "../storage/indexed";

const store = new LocalDatabase();
const lorocontent = store.get('dev-test');

import { LoroDoc, UndoManager } from "loro-crdt";
import { FractosState, FractosView, type ViewMode } from "@glifox/fractos";
import { renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'
import { SideProject } from "../components/web/side-project";
import { domReady, downloadContent, startTimer } from "../utils";
import type { NewProjectDialog } from "../components/web/new-project.dialog";

class App {
  ldoc = new LoroDoc();
  clipboard = new UndoManager(this.ldoc, {});
  state = new FractosState({ doc: this.ldoc });
  mainView: FractosView | null = null;
  sideView: FractosView | null = null;
  chanel: BroadcastChannel = new BroadcastChannel('fractos:updates:ldco');

  __view: HTMLElement | null = null;
  
  async init() {
    await Promise.all([
      lorocontent.then((c) => { if (c) this.ldoc.import(c) }),
      domReady,
    ]);

    document.querySelector('.loader')?.remove();
    
    this.main();
    this.side();

    this.buttons();

    this.ldoc.subscribeLocalUpdates((e) => {
      this.chanel.postMessage({ updates: e });
    })
    
    this.chanel.onmessage = (evento) => {
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
    
    this.mainView = new FractosView({
      state: this.state,
      parent: __view,
      renderer,
    })
  
    const keymap = Keymap.subscribe(this.mainView, this.clipboard);
  }
  
  async side() {
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
  }

  async buttons() {
    const __btImport = document.getElementById('import')! as HTMLButtonElement;
    const __btExport = document.getElementById('export')! as HTMLButtonElement;
    const __import = document.getElementById('input-archivo')! as HTMLInputElement;
    const __loader = document.getElementById('loader')! as HTMLElement;
  
    const __btSave = document.getElementById('save')! as HTMLButtonElement;
    __btSave.addEventListener('click', _ => {
      store.set('dev-test', this.ldoc.export({ mode: "snapshot" })).then(() => { 
        __btSave.innerText = '🚀 Saved!!!!'
        __btSave.disabled = true;
        
        startTimer(() => { 
          __btSave.innerText = 'save'
          __btSave.disabled = false;
        }, 300);
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
}

const app = new App();
app.init()
