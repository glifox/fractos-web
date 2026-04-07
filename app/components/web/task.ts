import "../web/linear-progress";
import { TitleEditor } from "../class/title";

import type { EditorView } from "codemirror";
import type { FractosState, TaskData } from "fractos";
import type { TreeID } from "loro-crdt";
import { Transaction } from "@codemirror/state";

declare global { interface String { readonly dot: string; } }
Object.defineProperty(String.prototype, 'dot', {
  get: function (this: String) { return `.${this.valueOf()}`;},
  configurable: true,
});

export const task_elements = {
  root: { class: "--ts-root" },
  title: { class: "--ts-title" },
  content: { class: "--ts-content" },
  checkbox: { class: "--ts-checkbox" },
  percentage: { class: "--ts-percentage" },
  children: { class: "--ts-children" },
} as const;

type TaskElement = keyof typeof task_elements;

const innerHTML = /* html */`
<div class="${task_elements.content.class}" tabindex="0">
    <input class="${task_elements.checkbox.class}" type="checkbox"/>
    <h3 class="${task_elements.title.class}"></h3>
    <linear-progress class="${task_elements.percentage.class}"></linear-progress>
</div>
<div class="${task_elements.children.class}" style="padding-left: 16px"></div>
`;


export class FractosTaskElement extends HTMLElement {
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __content: HTMLElement;
  private __checkbox: HTMLElement;
  private __percentage: HTMLElement;
  private __children: HTMLElement;
  
  private cmTitle: EditorView;
  private state?: FractosState;

  private _percentage: number = 0;
  get percentage() { return this._percentage }
  
  get treeid() { return this.id as TreeID };
  get root() { return this }
  get tasks() { return this.__children }
  get isEditing() { return this.cmTitle.hasFocus }
  override tagName: string = taskTag;
  
  constructor() { super()
    this.__root = document.createElement('div');
    this.__root.classList.add(task_elements.root.class);
    this.__root.innerHTML = innerHTML;
    
    this.__title = this.__root.querySelector(task_elements.title.class.dot)! as HTMLElement;
    this.__content = this.__root.querySelector(task_elements.content.class.dot)! as HTMLElement;
    this.__checkbox = this.__root.querySelector(task_elements.checkbox.class.dot)! as HTMLElement;
    this.__percentage = this.__root.querySelector(task_elements.percentage.class.dot) as HTMLElement;
    this.__children = this.__root.querySelector(task_elements.children.class.dot) as HTMLElement;
    
    this.cmTitle = TitleEditor(this.__title, {
      onConfirm: () => { 
        this.focus()
      },
      onCancel: () => { },
    });
    
    this.setEvents()
  }
  
  init(state: FractosState) {
    this.state = state;
    this.appendChild(this.__root)
  }
  setTitle = (title: string) => {
    this.cmTitle.dispatch({
      changes: { from: 0, insert: title, to: this.cmTitle.state.doc.length },
      annotations: [ Transaction.addToHistory.of(false) ]
    })
  }
  
  setPercentage  = (percentage: number) => {
    if (percentage == 100) (this.__checkbox as HTMLInputElement).checked = true; 
    else if (percentage < 100 && percentage >= 0) (this.__checkbox as HTMLInputElement).checked = false; 
    else throw Error(`[class::task] Invalid value of percentage: '${percentage}'`)
    
    this.__percentage.dataset.percentage = `${percentage}`;
    this._percentage = percentage;
  }
  
  // Internals
  private events: { [Z in TaskElement]?: { [K in keyof HTMLElementEventMap]?: EventListener } } = {
    'checkbox': {
      'click': (_) => this.toggleCheck()
    },
  }
  
  private setEvents() {
    const elements: { [Z in TaskElement]: HTMLElement } = {
      root: this.__root,
      title: this.__title,
      content: this.__content,
      checkbox: this.__checkbox,
      percentage: this.__percentage,
      children: this.__children,
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
  
  // Actions
  private updateTitle() {
    this.state?.update({
      id: this.id as TreeID,
      type: "task",
      title: this.cmTitle.state.doc.toString(),
    })
  }
  // Selectors
  override get children() { return this.__children.children }
  get parentTask(): FractosTaskElement | undefined {
    const __element = this.parentElement?.closest(taskTag);
    if (__element) {
      return (__element as FractosTaskElement)
    }
  }
  get nextTaskSibling(): FractosTaskElement | undefined {
    const __element = this.nextElementSibling;
    if (__element && __element.tagName === taskTag) {
      return __element as FractosTaskElement
    }
  }
  
  get previousTaskSibling(): FractosTaskElement | undefined {
    const __element = this.previousElementSibling;
    if (__element && __element.tagName === taskTag) {
      return __element as FractosTaskElement
    }
  }
  
  get firstTaskChild(): FractosTaskElement | undefined {
    for (const __element of this.children) {
      if (__element && __element.tagName === taskTag) {
        return __element as FractosTaskElement
      }
    }
  }
  
  get lastTaskChild(): FractosTaskElement | undefined {
    const children = this.children;
    const last = children.length - 1;
    for (let i = last; i >= 0; i--) {
      const __element = children.item(i)
      if (__element && __element.tagName === taskTag) {
        return __element as FractosTaskElement
      }
    }
  }
  
  // -- Focus
  override focus(options?: FocusOptions): void { this.__content.focus(options) }
  _focus = {
    firstChild: () => {
      const __firstChild = this.firstTaskChild;
      if (!__firstChild) return
      
      __firstChild.focus();
      return true
    },
    nextSibling: () => {
      const __sibling = this.nextTaskSibling;
      if (!__sibling) return
      
      __sibling.focus()
      return true
    },
    previousSibling: () => {
      const __prev_sibling = this.previousTaskSibling;
      if (!__prev_sibling) return
      
      __prev_sibling.focus()
      return true
    },
    previousSiblingLastChild: () => {
      const __prev_sibling = this.previousTaskSibling;
      if (!__prev_sibling) return
      
      const __lastChild = __prev_sibling.lastTaskChild;
      if (!__lastChild) return
      
      __lastChild.focus()
      return true
    },
    parentSibling: () => {
      const __parent = this.parentTask;
      if (!__parent) return
      
      const __parentSibling = __parent.nextTaskSibling;
      if (!__parentSibling) return
      
      __parentSibling.focus()
      return true
    },
    parent: () => {
      const __parent = this.parentTask;
      if (!__parent) return
      
      __parent.focus()
      return true
    }
  }
  
  focusGerarquicalNextTask() {
    if (this._focus.firstChild()) return;
    if (this._focus.nextSibling()) return;
    if (this._focus.parentSibling()) return;
  }
  
  focusGerarquicalPreviousTask() {
    if (this._focus.previousSiblingLastChild()) return;
    if (this._focus.previousSibling()) return;
    if (this._focus.parent()) return;
  }
  
  toggleCheck(invert: boolean = false) {
    if (!this.state) return
    if (invert !== (this.__checkbox as HTMLInputElement).checked) this.state.update({ type: "task", percentage: 100, id: this.treeid })
    else this.state.reCalculatePercentage(this.treeid);
  }
  
  changePercentage(mode: "up" | "down", step: number = 10) {
    if (!this.state) return
    if (this.__children.childElementCount > 0) return;
    
    let percentage = this._percentage;
    if (mode == "up") {
      percentage += step;
      if (percentage > 100) percentage = 100
    }
    if (mode == "down") {
      percentage -= step;
      if (percentage < 0) percentage = 0
    }
    
    if (percentage !== this._percentage) {
      this.state.update({
        id: this.treeid,
        type: "task",
        percentage,
      })
    }
  }
}

export const taskTag = 'fractos-task';
customElements.define(taskTag, FractosTaskElement);
export {};