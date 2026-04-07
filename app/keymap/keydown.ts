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

export const keyboardHandler = createKeybindingsHandler<[FractosView, Context]>({
  'ArrowUp': (e, v, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      c.task.focusGerarquicalPreviousTask()
      return
    }
    
    (Array.from(document.getElementsByTagName(taskTag)).pop() as FractosTaskElement).focus()
  },
  'ArrowDown': (e, v, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      c.task.focusGerarquicalNextTask()
      return
    }
    
    (document.getElementsByTagName(taskTag)[0] as FractosTaskElement).focus()
  },
})