import { LocalDatabase } from "../storage/indexed";
import { LoroDoc } from "loro-crdt";
import { FractosState, FractosView } from "fractos";
import { Renderer } from "../components/implementations/renderer";
import { Keymap } from '../keymap/handler'

const store = new LocalDatabase();

const doc = new LoroDoc()
document.getElementById('save')!.addEventListener('click', _ => {
  store.set('dev-test', doc.export({ mode: "snapshot" })).then(() => { 
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
  if (v) doc.import(v);
  
  document.querySelector('.loader')?.remove()
  
  const state = new FractosState({ doc });
  const view = new FractosView({
    state: state,
    parent: document.getElementById("view")!,
    render: new Renderer(state),
  })
  
  const keymap = Keymap.subscribe(view);
})

// const pr = state.createProject({
//   title: "this is not a project",
//   description: "Just kidding, it is",
// })


// state.createTask({
//   title: "llamar a jesus",
//   description: "Si señor",
//   percentage: 20,
// }, pr)


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
