import '../app/components/linear-progress';
import type { __Project, __Task, FractosRenderer, Metadata, ShowState } from "fractos";
import type { HasExpressionInitializer } from "typescript";

export class Renderer implements FractosRenderer {
  changeState(el: __Task | __Project, state: ShowState): void {
    
  } 
  
  task(data: Metadata): __Task {
    const __fake_root = document.createElement('div');
    __fake_root.innerHTML = TASK;
    
    const __root = __fake_root.querySelector(".--ts-root")! as HTMLElement;
    const __title = __fake_root.querySelector(".--ts-title")! as HTMLElement;
    const __checkbox = __fake_root.querySelector("input")! as HTMLInputElement;
    const __percentage = __fake_root.querySelector(".--ts-progress")! as HTMLElement;
    // const __description = __fake_root.querySelector(".--ts-root")! as HTMLElement;
    const __tasks = __fake_root.querySelector(".--ts-childs")! as HTMLElement;
    
    __title.innerText = data.title || "";
    // __description.innerText = data.description || "";
    if (data.percentage) Renderer.setProgress(__checkbox, __percentage, data.percentage);
    
    return {
      self: __root,
      tasks: __tasks,
      title: (title) => { __title.innerText = title },
      description: (description) => {  },
      percentage: (value) => {
        Renderer.setProgress(__checkbox, __percentage, value)
      },
    }
  }
  
  project(data: Metadata): __Project {
    const __root = document.createElement("div");
    const __title = document.createElement("h1");
    const __percentage = document.createElement("span");
    const __description = document.createElement("p");
    const __tasks = document.createElement("div");
    
    __title.innerText = data.title || "";
    __description.innerText = data.description || "";
    __percentage.innerText = `${data.percentage || 0}%`;
    
    __root.append(__title, __percentage, __description, __tasks)
    
    return {
      self: __root,
      tasks: __tasks,
      title: (title) => { __title.innerText = title },
      description: (description) => { __description.innerText = description },
      percentage: (value) => { __percentage.innerText = `${value}%` },
    }
  }
  
  private static setProgress(__checkbox: HTMLInputElement, __element: HTMLElement, percentage: number) {
    if (percentage == 100) __checkbox.checked = true; 
    else if (percentage < 100 && percentage >= 0) __checkbox.checked = false; 
    else throw Error(`[renderer] Invalid value of percentage: '${percentage}'`)
    
    __element.dataset.percentage = `${percentage}`;
  }
}

const TASK = /* html */`
  <div class="--ts-root">
      <input type="checkbox"/>
      <div style="display: inline flex; flex-direction: column;">
          <h3 class="--ts-title">Titulo</h3>
          <!--<p>This is a description</p>-->
      </div>
      <linear-progress class="--ts-progress"></linear-progress>
      <div class="--ts-childs"></div>
  </div>
  `;