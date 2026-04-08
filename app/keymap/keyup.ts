import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosState, FractosView } from "fractos"
import type { Context } from "./handler"
import { FractosTaskElement, taskTag } from "../components/web/task"
import type { FractosProjectElement } from "../components/web/project"
// import { taskTag, type FractosTaskElement } from "../components/web/task"

const newTask = (state: FractosState, parent: FractosProjectElement | FractosTaskElement) => {
  const newTask = document.createElement(taskTag) as FractosTaskElement;
  
  newTask.init(state, {
    onConfirm: (ev) => {
      newTask.id = state.createTask({
        title: ev.state.doc.toString(),
        description: ""
      }, parent.treeid)
      
      requestAnimationFrame(() => {
        newTask.focus()
      })
    },
    onCancel: () => newTask.remove()
  })
  
  parent.tasks.appendChild(newTask)
  newTask.scrollIntoView()
  newTask.editTitle()
}

export const keyboardHandler = createKeybindingsHandler<[Context, FractosView]>({
  'enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      let parent: FractosTaskElement | FractosProjectElement | undefined = c.task.parentTask;
      if (!parent) parent = c.project!!
      
      newTask(v.state, parent);
      return
    }
    if (c.project) {
      newTask(v.state, c.project);
      return
    }
  },
  'shift-enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      newTask(v.state, c.task)
      return
    }
  },
})