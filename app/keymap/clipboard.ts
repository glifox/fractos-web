import type { FractosView } from "@glifox/fractos";
import type { Context, ContextNode } from "./handler";
import { projectTag, type FractosProjectElement } from "../components/web/project";
import { taskTag, type FractosTaskElement } from "../components/web/task";
import type { TreeID } from "loro-crdt";

export const getContext: {
  [P in keyof ContextNode]: (e: ClipboardEvent) => void | ContextNode[P];
} = {
  panel: (e) => {
    // @ts-ignore
    const panel = (e.explicitOriginalTarget as HTMLElement).closest('.main.panel');
    if (panel) return panel as HTMLElement
  },
  project: (e) => {
    // @ts-ignore
    const project = (e.explicitOriginalTarget as HTMLElement).closest(projectTag);
    if (project) return project as FractosProjectElement;
  },
  task: (e) => {
    // @ts-ignore
    const task = (e.explicitOriginalTarget as HTMLElement).closest(taskTag);
    if (task) return task as FractosTaskElement
  }
};

type ClipboardListener = (event: ClipboardEvent, context: Context, view: FractosView) => void;

const key = 'application/fractos-node' as const;

const handler = (e: ClipboardEvent, type: "copy" | "paste", view: FractosView) => {
  const context: Context = {};
  
  const task = getContext.task(e);
  if (task) context.task = task;
  
  const project = getContext.project(e);
  if (project) context.project = project;
  
  const panel = getContext.panel(e);
  if (panel) context.panel = panel;
  
  if (type == "copy") oncopy(e, context, view)
  else
  if (type == "paste") onpaste(e, context, view)
}

export const Clipboard = (() => {
  let handlerCopy: ((e: KeyboardEvent) => void) | null = null;
  let handlerPaste: ((e: KeyboardEvent) => void) | null = null;
  
  return {
    subscribe: (view: FractosView) => { 
      let handlerCopy = (e: ClipboardEvent) => handler(e, 'copy', view);
      let handlerPaste = (e: ClipboardEvent) => handler(e, 'paste', view);
      
      document.addEventListener('copy', handlerCopy)
      document.addEventListener('paste', handlerPaste)
    },
    unsubscribe: () => {
      if ( handlerCopy ) document.removeEventListener('copy', handlerCopy)
      if (handlerPaste) document.removeEventListener('paste', handlerPaste)
    },
  }
})()

const oncopy: ClipboardListener = (e, c, view) => {
  if (!(c.task)) return;
  if (c.task && c.task.isEditing) return;

  e.preventDefault()
  const target = c.task.treeid;
  e.clipboardData?.setData(key, target);
  e.clipboardData?.setData('text', c.task.tasktitle);
}

const onpaste: ClipboardListener = (e, c, view) => {
  if (!(c.task)) return;
  if (c.task && c.task.isEditing) return;

  const target = e.clipboardData?.getData(key);

  if (!target) return; 
  if (target === c.task.treeid) return;
  e.preventDefault();

  const parent = c.task.treeid;
  view.state.copy({ id: target as TreeID }, { id: parent })
}