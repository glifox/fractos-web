import { LocalDatabase } from "../storage/indexed";

console.info("document.readyState:", document.readyState);

const store = new LocalDatabase();
const lorocontent = store.get('dev-test');

import { LoroDoc } from "loro-crdt";
import { FractosState, FractosView, type ViewMode } from "@glifox/fractos";
import { renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'
import { SideProject } from "../components/web/side-project";
import { domReady, startTimer } from "../utils";
import type { NewProjectDialog } from "../components/web/new-project.dialog";

class App {
  ldoc = new LoroDoc();
  state = new FractosState({ doc: this.ldoc });
  mainView: FractosView | null = null;
  sideView: FractosView | null = null;

  async init() {
    await Promise.all([
      lorocontent.then((c) => { if (c) this.ldoc.import(c) }),
      domReady,
    ]);

    document.querySelector('.loader')?.remove();
    
    this.main();
    this.side();

    this.buttons();
  }
  
  async main() {
    const __view = document.getElementById("view")!;
    
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
  
    const keymap = Keymap.subscribe(this.mainView);
  }
  
  async side() {
    const __side = document.getElementById("list")!;
  
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
  }
}

const app = new App();

app.init()
