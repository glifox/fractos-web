import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosView } from "fractos"
import type { Context } from "./handler"
import { FractosTaskElement, taskTag } from "../components/web/task"
import type { FractosProjectElement } from "../components/web/project"
// import { taskTag, type FractosTaskElement } from "../components/web/task"


export const keyboardHandler = createKeybindingsHandler<[Context, FractosView]>({
  'enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      let parent: FractosTaskElement | FractosProjectElement | undefined = c.task.parentTask;
      if (!parent) parent = c.project!!
      
      const newTask = document.createElement(taskTag) as FractosTaskElement;
      
      newTask.init(v.state, {
        onConfirm: (ev) => {
          newTask.id = v.state.createTask({
            title: ev.state.doc.toString(),
            description: ""
          }, parent.treeid)
          
          requestAnimationFrame(() => newTask.focus())
        },
        onCancel: () => newTask.remove()
      })
      
      parent.tasks.appendChild(newTask)
      newTask.editTitle()
      
      return
    }
  },
  'shift-enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      const newTask = document.createElement(taskTag) as FractosTaskElement;
      
      newTask.init(v.state, {
        onConfirm: (ev) => {
          newTask.id = v.state.createTask({
            title: ev.state.doc.toString(),
            description: ""
          }, c.task!.treeid)
          
          requestAnimationFrame(() => newTask.focus())
        },
        onCancel: () => newTask.remove()
      })
      
      c.task.tasks.appendChild(newTask)
      newTask.editTitle()
      
      return
    }
  },
})