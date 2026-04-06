import '../web/task'

import type { TreeID } from 'loro-crdt';
import type { __Project, __Task, FractosRenderer, FractosState, Metadata, ShowState } from "fractos";
import type { FractosTaskElement } from '../web/task';


export class Renderer implements FractosRenderer {
  constructor(private state: FractosState) {}
  
  changeState(el: __Task | __Project, state: ShowState): void {} 
  
  task(data: Metadata, id: TreeID): __Task {
    const _task = document.createElement('fractos-task') as FractosTaskElement;
    
    _task.init(this.state);
    _task.setTitle(data.title ?? "");
    if (data.percentage) _task.setPercentage(data.percentage);
    
    return {
      self: _task.root,
      tasks: _task.tasks,
      title: (s) => _task.setTitle(s),
      description: (_) => {  },
      percentage: (n) => _task.setPercentage(n),
    }
  }
  
  project(data: Metadata, id: TreeID): __Project {
    const __root = document.createElement("div");
    const __title = document.createElement("h1");
    const __percentage = document.createElement("span");
    const __description = document.createElement("p");
    const __tasks = document.createElement("div");
    
    __title.innerText = data.title || "";
    __description.innerText = data.description || "";
    __percentage.innerText = `${data.percentage || 0}%`;
    
    __root.append(__title, __percentage, __description, __tasks)
    
    __tasks.classList.add("--ts-childs");
    __tasks.dataset.treeid = id;
    
    return {
      self: __root,
      tasks: __tasks,
      title: (title) => { __title.innerText = title },
      description: (description) => { __description.innerText = description },
      percentage: (value) => { __percentage.innerText = `${value}%` },
    }
  }
}
