import { createKeybindingsHandler } from "@glifox/desmos"

import type { FractosView } from "fractos"
import type { Context } from "./handler"
import { FractosTaskElement, taskTag } from "../components/web/task"
import type { FractosProjectElement } from "../components/web/project"
// import { taskTag, type FractosTaskElement } from "../components/web/task"


export const keyboardHandler = createKeybindingsHandler<[FractosView, Context]>({
  'enter': (e, v, c) => {
    if (c.task) {
      if (c.task.isEditing) return
      let parent: FractosTaskElement | FractosProjectElement | undefined = c.task.parentTask;
      if (!parent) parent = c.project!!
      
      const newTask = document.createElement(taskTag) as FractosTaskElement;
      
      newTask.init(v.state)
      parent.tasks.appendChild(newTask)
      
      newTask.focus()
      
      return
    }
  },
})