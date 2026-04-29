import { LocalDatabase } from "../storage/indexed";
import { LoroDoc } from "loro-crdt";
import { FractosState, FractosView } from "fractos";
import { renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'
import { SideProject } from "../components/web/side-project";
import { BaseEditor } from "../components/class/base";
import type { NewProjectDialog } from "../components/web/new-project.dialog";

const store = new LocalDatabase();

const ldoc = new LoroDoc()
document.getElementById('save')!.addEventListener('click', _ => {
  store.set('dev-test', ldoc.export({ mode: "snapshot" })).then(() => { 
    const button = document.getElementById('save')! as HTMLButtonElement;
    
    console.info("button:", button);
    button.innerText = '🚀 Saved!!!!'
    button.disabled = true;
    
    let timeoutId: number | null = null;
    
    function startTimer() {
      const startTime = Date.now();
      
      const timeoutHandler = () => {
        if (Date.now() - startTime >= 600) {
          button.innerText = 'save'
          button.disabled = false;
          window.cancelAnimationFrame(timeoutId!);
        } else {
          timeoutId = requestAnimationFrame(timeoutHandler);
        }
      };
    
      timeoutId = requestAnimationFrame(timeoutHandler);
    }
    
    startTimer();
    
  } )
})


store.get('dev-test').then(v => {
  if (v) ldoc.import(v);
  
  document.querySelector('.loader')?.remove()
  
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
  
  const keymap = Keymap.subscribe(mainView);
  
  const dialog = document.getElementById('new-project--dialog') as NewProjectDialog;
  dialog.init(state);

  const showAll = document.getElementById("all")! as HTMLButtonElement;

  showAll.addEventListener('click', () => {
    requestAnimationFrame(() => {
      mainView.setMode({ type: 'all' });
      
      const prs = document.querySelectorAll('.side-project.active')
      prs.forEach((__element) => __element.classList.remove('active'))
      showAll.classList.add('active')
    })
  })
})

// const pr = state.create({
//   type: 'project',
//   title: "this is not a project",
//   description: "Just kidding, it is",
// })


// state.create({
//   type: 'task',
//   parent: pr,
//   title: "llamar a jesus",
//   description: "Si señor",
//   percentage: 20,
// })


// const ts = state.createTask({
//   title: "otra tarea",
//   description: "Si señor",
//   percentage: 100,
// }, pr)

// state.createTask({
//   title: "subtarea1",
//   description: "Si señor",
//   percentage: 10,
// }, ts)

// state.createTask({
//   title: "subtarea3",
//   description: "Si señor",
//   percentage: 0,
// }, ts)

// state.createTask({
//   title: "subtarea2",
//   description: "Si señor",
//   percentage: 60,
// }, ts)

// state.update({
//   id: ts,
//   type: "task",
//   title: "como?",
// })

// state.createTask({
//   title: "third task",
//   description: "Si señor",
//   percentage: 60,
// }, pr)
