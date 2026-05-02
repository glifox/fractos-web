import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosState, FractosView } from "fractos"
import type { Context } from "./handler"
import { FractosTaskElement, taskTag } from "../components/web/task"
import type { FractosProjectElement } from "../components/web/project"
// import { taskTag, type FractosTaskElement } from "../components/web/task"

const newTask = (state: FractosState, parent: FractosProjectElement | FractosTaskElement, emiter: FractosProjectElement | FractosTaskElement) => {
  const newTask = document.createElement(taskTag) as FractosTaskElement;
  
  newTask.new({
    onConfirm: (ev) => {
      newTask.id = state.create({
        type: 'task',
        parent: parent.treeid,
        title: ev.state.doc.toString(),
        description: ""
      })
      
      requestAnimationFrame(() => {
        newTask.focus()
      })
    },
    onCancel: () => {
      newTask.remove()
      emiter.focus()
    }
  })
  
  parent.tasks.appendChild(newTask)
  newTask.scrollIntoView(false)
  newTask.editTitle()
}

export const keyboardHandler = createKeybindingsHandler<[Context, FractosView]>({
  'enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      let parent: FractosTaskElement | FractosProjectElement | undefined = c.task.parentTask;
      if (!parent) parent = c.project!!
      
      newTask(v.state, parent, c.task);
      return
    }
    if (c.project) {
      if (c.project.isEditing) return;
      newTask(v.state, c.project, c.project);
      return
    }
  },
  'shift-enter': (e, c, v) => {
    if (c.task) {
      if (c.task.isEditing) return
      newTask(v.state, c.task, c.task)
      return
    }
  },
})