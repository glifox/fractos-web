import { createKeybindingsHandler } from "@glifox/desmos";
import { task_elements, taskTag, type FractosTaskElement } from "../components/web/task";
import type { FractosView } from "fractos";

type PressType = "up" | "down";

type ContextNode = {
  panel: HTMLElement;
  project: HTMLDivElement;
  task: FractosTaskElement;
};

type Context = {
  [P in keyof ContextNode]?:  ContextNode[P]
}

const keyboardHandler = createKeybindingsHandler<[PressType, FractosView, Context]>({
  'ArrowUp': (e, p, v, c) => {
    if (p == "up") return;
    if ('task' in c) {
      c.task!.focusGerarquicalPreviousTask()
      return
    }
    
    (Array.from(document.getElementsByTagName(taskTag)).pop() as FractosTaskElement).focus()
  },
  'ArrowDown': (e, p, v, c) => {
    if (p == "up") return;
    if ('task' in c) {
      c.task!.focusGerarquicalNextTask()
      return
    }
    
    (document.getElementsByTagName(taskTag)[0] as FractosTaskElement).focus()
  },
})

const getContext: {
  [P in keyof ContextNode]: (e: KeyboardEvent) => void | ContextNode[P];
} = {
  panel: (e) => {
    const panel = (e.target as HTMLElement).closest('.main.panel');
    if (panel) return panel as HTMLElement
  },
  project: (e) => {
    
  },
  task: (e) => {
    const task = (e.target as HTMLElement).closest(taskTag);
    if (task) return task as FractosTaskElement
  }
};

const handler = (e: KeyboardEvent, type: PressType, view: FractosView) => {
  const context: Context = {};
  
  const task = getContext.task(e);
  if (task) context.task = task;
  
  const project = getContext.project(e);
  if (project) context.project = project;
  
  const panel = getContext.panel(e);
  if (panel) context.panel = panel;
  
  keyboardHandler(e, type, view, context)
}


export const Keymap = (view: FractosView) => {
  const handlerUp = (e: KeyboardEvent) => handler(e, "up", view)
  const handlerDown = (e: KeyboardEvent) => handler(e, "down", view)
  
  return {
    subscribe: () => { 
      document.addEventListener('keyup', handlerUp)
      document.addEventListener('keydown', handlerDown)
    },
    unsubscribe: () => {
      document.removeEventListener('keyup', handlerUp)
      document.removeEventListener('keydown', handlerDown)
    },
  }
}
