import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosView } from "fractos"
import type { Context } from "./handler"
import { taskTag, type FractosTaskElement } from "../components/web/task"
import type { FractosProjectElement } from "../components/web/project"

const keymap = {
  context: '',
  bindings: {
    '': () => { }
  }
}

export const keyboardHandler = createKeybindingsHandler<[Context, FractosView]>({
  'ArrowUp': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      if (c.task.focusGerarquicalPreviousTask()) return
    }
    
    if (c.project) { // Temporal
      if (c.project.isEditing) return;
      if (!c.task && c.project.previousProjectSibling?._focus.lastTaskChild()) return
      e.preventDefault()
      e.stopImmediatePropagation()
      c.project.previousProjectSibling?.focus()
      return
    }
    
    if (c.panel?.classList.contains('main')) {
      e.preventDefault();
      (Array.from(document.getElementsByTagName(taskTag)).pop() as FractosTaskElement).focus()
    }
  },
  'ArrowDown': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      if (c.task.focusGerarquicalNextTask()) return
    }
    
    if (c.project) { // Temporal
      if (c.project.isEditing) return;
      if (!c.task && c.project._focus.firstTaskChild()) return
      e.preventDefault();
      e.stopImmediatePropagation()
      c.project.nextProjectSibling?.focus()
      return
    }
    
    if (true) {
      e.preventDefault();
      (document.getElementsByTagName(taskTag)[0] as FractosTaskElement).focus()
    }
  },
  'Space': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      c.task.toggleCheck(true)
      return
    }
  },
  'shift-arrowup': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      c.task.changePercentage("up")
      return
    }
  },
  'shift-arrowdown': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      c.task.changePercentage("down")
      return
    }
  },
  'e': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      e.stopImmediatePropagation()
      c.task.editTitle()
      return
    }
  },
  'd': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      if (!c.task.focusGerarquicalPreviousTask()) c.task.focusGerarquicalNextTask()
      v.state.delete(c.task.treeid)
      return
    }
  },
  'escape': (e, c) => {
    if (c.task && c.task.isEditing) {
      e.preventDefault()
      c.task.focus()
      return
    }
  },
  'ctrl-s': (e, c) => {
    e.preventDefault()
    if (c.task && c.task.isEditing) return;
    (document.getElementById('save') as HTMLButtonElement)?.click()
  },
  'tab': (e, c, v) => { // TODO cuando se añadan los eventos de move
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      
      const __prevSibling = c.task.previousTaskSibling;
      if (!__prevSibling) return;
      
      v.state.moveTask(c.task.treeid, __prevSibling.treeid)
      requestAnimationFrame(() => c.task?.focus())
    }
  },
  'shift-tab': (e, c, v) => { // TODO cuando se añadan los eventos de move
    if (c.task) {
      if (c.task.isEditing) return
      e.preventDefault()
      
      let __parent: FractosTaskElement | FractosProjectElement | undefined = c.task.parentTask;
      if (!__parent) return;
      
      __parent = __parent.parentTask ?? c.project!;
      
      v.state.moveTask(c.task.treeid, __parent.treeid)
      requestAnimationFrame(() => c.task?.focus())
    }
  },
})