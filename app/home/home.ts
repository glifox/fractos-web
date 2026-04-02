import { LoroDoc } from "loro-crdt";
import { FractosState, FractosView } from "fractos";
import { Renderer } from "../../implementations/renderer";

const doc = new LoroDoc()

const state = new FractosState({ doc });
const view = new FractosView({
  state: state,
  parent: document.getElementById("view")!,
  render: new Renderer(state),
})


const pr = state.createProject({
  title: "this is not a project",
  description: "Just kidding, it is",
})


state.createTask({
  title: "llamar a jesus",
  description: "Si señor",
  percentage: 20,
}, pr)


const ts = state.createTask({
  title: "otra tarea",
  description: "Si señor",
  percentage: 100,
}, pr)

state.createTask({
  title: "subtarea1",
  description: "Si señor",
  percentage: 10,
}, ts)

state.createTask({
  title: "subtarea3",
  description: "Si señor",
  percentage: 0,
}, ts)

state.createTask({
  title: "subtarea2",
  description: "Si señor",
  percentage: 60,
}, ts)

state.update({
  id: ts,
  type: "task",
  title: "como?",
})