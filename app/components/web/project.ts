import { FractosCompositor, type Compositor, type FractosNode, type FractosState, type Node, type ProjectData } from "fractos";
import type { TreeID } from "loro-crdt";
import { taskTag, type FractosTaskElement } from "./task";


export const projectElements = {
  root: { class: "--pr-root" },
  title: { class: "--pr-title" },
  focus: { class: "--pr-focusable" },
  description: { class: "--pr-description" },
  percentage: { class: "--pr-percentage" },
  children: { class: "--pr-children" },
} as const;

type ProjectElement = keyof typeof projectElements;

const innerHTML = /* html */`
  <div class="--pr-metadata ${projectElements.focus.class}" tabindex="0">
    <h2 class="${projectElements.title.class}"></h2>
    <span class="${projectElements.percentage.class}"></span>
    <p class="${projectElements.description.class}"></p>
  </div>
  <div class="${projectElements.children.class}"></div>
`;

export class FractosProjectElement extends HTMLElement implements Node<'project'> {
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __description: HTMLElement;
  private __percentage: HTMLElement;
  private __children: HTMLElement;
  private __focus: HTMLElement;
  
  private state?: FractosState;
  override tagName: string = projectTag;
  
  type = "project" as const;
  compositor: Compositor;
  showChildren: boolean = true;
  
  get treeid() { return this.dataset.treeid as TreeID };
  get element() { return this }
  get tasks() { return this.__children }
  
  constructor() { super()
    
    this.__root = document.createElement('div');
    this.__root.innerHTML = innerHTML;
    this.__root.classList.add(projectElements.root.class);
    
    this.__title = this.__root.querySelector(projectElements.title.class.dot) as HTMLElement;
    this.__focus = this.__root.querySelector(projectElements.focus.class.dot) as HTMLElement;
    this.__description = this.__root.querySelector(projectElements.description.class.dot) as HTMLElement;
    this.__percentage = this.__root.querySelector(projectElements.percentage.class.dot) as HTMLElement;
    this.__children = this.__root.querySelector(projectElements.children.class.dot) as HTMLElement;
    
    this.compositor = new FractosCompositor(this.__children);
    
    this.setEvents();
  }
  
  init(state: FractosState, node: FractosNode) {
    this.state = state;
    this.appendChild(this.__root);
    this.dataset.treeid = node.treeid;
  }
  
  set<P extends keyof ProjectData>(key: keyof ProjectData, value: ProjectData[P]): void {
    if (key === 'title') this.setTitle(value);
    
    else
    // @ts-ignore
    if (key === 'percentage') this.setPercetage(value);
  
    else
    if (key == 'description') this.setDescription(value);
  }
  updateIndex(): void {
    
  }
  
  setTitle = (title: string) => {
    this.__title.innerText = title;
  }
  setPercetage = (percentage: number) => {
    this.__percentage.innerText = `${percentage}%`;
  }
  setDescription = (description: string) => {
    this.__description.innerText = description;
  }
  
  // Focus
  override focus(options?: FocusOptions) { this.__focus.focus(options) }
  _focus = {
    firstTaskChild: () => {
      const __element = this.firstTaskChild;
      if (!__element) return
      
      __element.focus()
      return true
    },
    lastTaskChild: () => {
      const __element = this.lastTaskChild;
      if (!__element) return
      
      __element.focus()
      return true
    }
    
  }
  
  // Internals
  private events: { [Z in ProjectElement]?: { [K in keyof HTMLElementEventMap]?: EventListener } } = {
  }
  
  private setEvents() {
    const elements: { [Z in ProjectElement]: HTMLElement } = {
      root: this.__root,
      title: this.__title,
      focus: this.__focus,
      percentage: this.__percentage,
      children: this.__children,
      description: this.__description
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
  
  // Selectors
  override get children() { return this.__children.children }
  get nextProjectSibling(): FractosProjectElement | undefined {
    const __element = this.nextElementSibling;
    if (__element && __element.tagName === projectTag) {
      return __element as FractosProjectElement
    }
  }
  
  get previousProjectSibling(): FractosProjectElement | undefined {
    const __element = this.previousElementSibling;
    if (__element && __element.tagName === projectTag) {
      return __element as FractosProjectElement
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
}

export const projectTag = 'fractos-project';
customElements.define(projectTag, FractosProjectElement);
export { };
