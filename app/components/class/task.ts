import "../web/linear-progress";

import type { FractosState, Metadata } from "fractos";
import type { TreeID } from "loro-crdt";


type TaskElement =
  "root" |
  "title" |
  "checkbox" |
  "percentage" |
  "tasks";

export class Task {  
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __checkbox: HTMLElement;
  private __percentage: HTMLElement;
  private __tasks: HTMLElement;
  
  constructor(private id: TreeID, private state: FractosState) {
    this.__root = document.createElement('div');
    this.__root.classList.add("--ts-root");
    this.__root.innerHTML = this.innerHTML;
    
    this.__title = this.__root.querySelector(".--ts-title")! as HTMLElement;
    this.__checkbox = this.__root.querySelector(".--ts-checkbox")! as HTMLElement;
    this.__percentage = this.__root.querySelector(".--ts-progress") as HTMLElement;
    this.__tasks = this.__root.querySelector(".--ts-childs") as HTMLElement;
    
    this.set_events();
  }
  
  setTitle = (title: string) => {
    this.__title.innerText = title
  }
  
  setPercentage = (percentage: number) => {
    if (percentage == 100) (this.__checkbox as HTMLInputElement).checked = true; 
    else if (percentage < 100 && percentage >= 0) (this.__checkbox as HTMLInputElement).checked = false; 
    else throw Error(`[class::task] Invalid value of percentage: '${percentage}'`)
    
    this.__percentage.dataset.percentage = `${percentage}`;
  }
  
  get root() { return this.__root }
  get tasks() { return this.__tasks }
  
  private set_events() {
    const elements: { [Z in TaskElement]: HTMLElement } = {
      root: this.__root,
      title: this.__title,
      checkbox: this.__checkbox,
      percentage: this.__percentage,
      tasks: this.__tasks,
    }
    
    for (const element of Object.keys(elements)) {
      if (element in this.events) {
        // @ts-ignore
        for (const event of Object.keys(this.events[element])) {
          // @ts-ignore
          elements[element].addEventListener(event, this.events[element][event])
        }
      }
    }
  }
  
    private innerHTML = /* html */`
    <div class="--ts-content">
        <input class="--ts-checkbox" type="checkbox"/>
        <h3 class="--ts-title"></h3>
        <linear-progress class="--ts-progress"></linear-progress>
    </div>
    <div class="--ts-childs" style="padding-left: 4px"></div>
  `;
  
  
  private events: { [Z in TaskElement]?: { [K in keyof HTMLElementEventMap]?: EventListener } } = {
    'checkbox': {
      'click': (event) => {
        if ((this.__checkbox as HTMLInputElement).checked) this.state.update({ type: "task", percentage: 100, id: this.id })
        else this.state.reCalculatePercentage(this.id);
      }
    }
  }
}
