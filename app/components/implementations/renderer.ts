import '../web/task'

import type { TreeID } from 'loro-crdt';
import type { FractosState, Renderer as FractosRenderer } from "@glifox/fractos";
import { taskTag, type FractosTaskElement } from '../web/task';
import { FractosProjectElement, projectTag } from '../web/project';


export const renderer: FractosRenderer = {
  project: (view, node) => {
    const _project = document.createElement(projectTag) as FractosProjectElement;
    
    _project.init(view.state, node);
    _project.setTitle(node.get('title'));
    _project.setDescription(node.get('description'));
    _project.setPercetage(node.get('percentage') ?? 0);
    
    return _project
  },
  task: (view, node) => {
    const __task = document.getElementById(node.treeid);
    const _task = (__task)
      ? __task as FractosTaskElement
      : document.createElement(taskTag) as FractosTaskElement;
    
    _task.id = node.treeid;
    _task.init(view.state, node);
    _task.setTitle(node.get('title'));
    _task.setPercentage(node.get('percentage') ?? 0);
    
    return _task
  }
}
