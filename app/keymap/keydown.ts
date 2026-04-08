import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosView } from "fractos"
import type { Context } from "./handler"
import { taskTag, type FractosTaskElement } from "../components/web/task"

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
      c.task.focusGerarquicalPreviousTask()
      return
    }
    
    (Array.from(document.getElementsByTagName(taskTag)).pop() as FractosTaskElement).focus()
  },
  'ArrowDown': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      c.task.focusGerarquicalNextTask()
      return
    }
    
    (document.getElementsByTagName(taskTag)[0] as FractosTaskElement).focus()
  },
  'Space': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      c.task.toggleCheck(true)
      return
    }
  },
  'shift-arrowup': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      c.task.changePercentage("up")
      return
    }
  },
  'shift-arrowdown': (e, c) => {
    if (c.task) {
      if (c.task.isEditing) return
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
  }
  // 'tab': (e, c, v) => { // TODO cuando se añadan los eventos de move
  //   if (c.task) {
  //     if (c.task.isEditing) return
  //     e.preventDefault()
      
  //     const __prevSibling = c.task.previousTaskSibling;
  //     if (!__prevSibling) return;
      
  //     v.state.moveTask(c.task.treeid, __prevSibling.treeid)
  //   }
  // },
})