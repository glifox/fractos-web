import '../web/task'

import type { TreeID } from 'loro-crdt';
import type { __Project, __Task, FractosRenderer, FractosState, Metadata, ShowState } from "fractos";
import { taskTag, type FractosTaskElement } from '../web/task';
import { FractosProjectElement, projectTag } from '../web/project';


export class Renderer implements FractosRenderer {
  constructor(private state: FractosState) {}
  
  changeState(el: __Task | __Project, state: ShowState): void {} 
  
  task(data: Metadata, id: TreeID): __Task {
    let _task = document.getElementById(id) as FractosTaskElement;
    if (!_task) {
      _task = document.createElement(taskTag) as FractosTaskElement;
      
      _task.init(this.state);
      _task.setTitle(data.title ?? "");
      if (data.percentage) _task.setPercentage(data.percentage);
    }
    
    return {
      self: _task.root,
      tasks: _task.tasks,
      title: (s) => _task.setTitle(s),
      description: (_) => {  },
      percentage: (n) => _task.setPercentage(n),
    }
  }
  
  project(data: Metadata, id: TreeID): __Project {
    const _project = document.createElement(projectTag) as FractosProjectElement;
    
    _project.init(this.state);
    _project.setTitle(data.title ?? "");
    _project.setDescription(data.description ?? "");
    _project.setPercetage(data.percentage || 0);
    
    return {
      self: _project.root,
      tasks: _project.tasks,
      title: (title) => _project.setTitle(title),
      description: (description) => _project.setDescription(description),
      percentage: (value) => _project.setPercetage(value),
    }
  }
}
