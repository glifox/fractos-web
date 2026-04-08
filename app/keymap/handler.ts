import { keyboardHandler as keyboardHandlerDown } from "./keydown";
import { keyboardHandler as keyboardHandlerUp } from "./keyup";
import { taskTag, type FractosTaskElement } from "../components/web/task";


import type { FractosView } from "fractos";
import { projectTag, type FractosProjectElement } from "../components/web/project";

type PressType = "up" | "down";

export type ContextNode = {
  panel: HTMLElement;
  project: FractosProjectElement;
  task: FractosTaskElement;
};

export type Context = {
  [P in keyof ContextNode]?:  ContextNode[P]
}


const getContext: {
  [P in keyof ContextNode]: (e: KeyboardEvent) => void | ContextNode[P];
} = {
  panel: (e) => {
    const panel = (e.target as HTMLElement).closest('.main.panel');
    if (panel) return panel as HTMLElement
  },
  project: (e) => {
    const project = (e.target as HTMLElement).closest(projectTag);
    if (project) return project as FractosProjectElement;
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
  
  if (type == "down") keyboardHandlerDown(e, context, view)
  else
  if (type == "up") keyboardHandlerUp(e, context, view)
}


export const Keymap = (() => {
  let handlerUp: ((e: KeyboardEvent) => void) | null = null;
  let handlerDown: ((e: KeyboardEvent) => void) | null = null;
  
  return {
    subscribe: (view: FractosView) => { 
      handlerUp = (e: KeyboardEvent) => handler(e, "up", view)
      handlerDown = (e: KeyboardEvent) => handler(e, "down", view)
      
      document.addEventListener('keyup', handlerUp)
      document.addEventListener('keydown', handlerDown)
    },
    unsubscribe: () => {
      if ( handlerUp ) document.removeEventListener('keyup', handlerUp)
      if (handlerDown) document.removeEventListener('keydown', handlerDown)
    },
  }
})();
