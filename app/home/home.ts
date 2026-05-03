import { LocalDatabase } from "../storage/indexed";
import { LoroDoc } from "loro-crdt";
import { FractosState, FractosView } from "fractos";
import { renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'
import { SideProject } from "../components/web/side-project";
import type { NewProjectDialog } from "../components/web/new-project.dialog";

const startTimer = (oncomplete: () => void, duration: number) => {
  let timeoutId: number | null = null;
  const startTime = Date.now();
  
  const timeoutHandler = () => {
    if (Date.now() - startTime >= duration) {
      oncomplete();
      window.cancelAnimationFrame(timeoutId!);
    } else {
      timeoutId = requestAnimationFrame(timeoutHandler);
    }
  };

  timeoutId = requestAnimationFrame(timeoutHandler);
}

const store = new LocalDatabase();

const ldoc = new LoroDoc();

const state = new FractosState({ doc: ldoc });
const mainView = new FractosView({
  state: state,
  parent: document.getElementById("view")!,
  renderer,
})

const sideView = new FractosView({
  state: state,
  parent: document.getElementById("list")!,
  renderer: {
    task: () => { throw new Error("Unreachable state") },
    project: (_, n) => new SideProject(mainView, n)
  }
})

const __btImport = document.getElementById('import')! as HTMLButtonElement;
const __btExport = document.getElementById('export')! as HTMLButtonElement;
const __import = document.getElementById('input-archivo')! as HTMLInputElement;


__import.addEventListener('change', (evento: Event) => {
  const input = evento.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const archivo = input.files[0];
  const lector = new FileReader();

  lector.onload = () => {
    const buffer = lector.result as ArrayBuffer;
    const contenido = new Uint8Array(buffer);
    
    ldoc.import(contenido);
    mainView.setMode({ type: "all" });
    sideView.setMode({ type: "all" });
    
    __btImport.classList.add('success')
    
    startTimer(() => {
      __btImport.classList.remove('success')
      __btImport.disabled = false;
    }, 2000)
  };

  lector.onerror = (error) => {
    console.error("Error al leer el archivo:", error);
    __btImport.classList.add('error')
    
    startTimer(() => {
      __btImport.classList.remove('error')
      __btImport.disabled = false;
    }, 2000)
  };

  lector.readAsArrayBuffer(archivo!);
});

__btImport.addEventListener('click', () => {
  __btImport.disabled = true;
  __import.click()
})

__btExport.addEventListener('click', () => {
  __btExport.disabled = true;
  let content = ldoc.export({ mode: "snapshot" })
  
  const cleanUint8Array = new Uint8Array(content); 
  const blob = new Blob([cleanUint8Array], { type: 'application/octet-stream' });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'fractos.loro';

  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
  __btExport.disabled = false;
})

document.getElementById('save')!.addEventListener('click', _ => {
  store.set('dev-test', ldoc.export({ mode: "snapshot" })).then(() => { 
    const button = document.getElementById('save')! as HTMLButtonElement;
    
    console.info("button:", button);
    button.innerText = '🚀 Saved!!!!'
    button.disabled = true;
    
    startTimer(() => { 
      button.innerText = 'save'
      button.disabled = false;
    }, 600);
  })
})


store.get('dev-test').then(v => {
  if (v) ldoc.import(v);
  mainView.setMode({ type: "all" });
  sideView.setMode({ type: "all" });
  
  document.querySelector('.loader')?.remove()
  
  const keymap = Keymap.subscribe(mainView);
  
  const dialog = document.getElementById('new-project--dialog') as NewProjectDialog;
  dialog.init(state);

  const showAll = document.getElementById("all")! as HTMLButtonElement;

  showAll?.addEventListener('click', () => {
    requestAnimationFrame(() => {
      mainView.setMode({ type: 'all' });
      
      const prs = document.querySelectorAll('.side-project.active')
      prs.forEach((__element) => __element.classList.remove('active'))
      showAll.classList.add('active')
    })
  })
})
