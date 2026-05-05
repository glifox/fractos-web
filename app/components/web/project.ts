import "./circular-progress";
import { FractosCompositor, type Compositor, type FractosNode, type FractosState, type Node, type ProjectData } from "@glifox/fractos";
import type { TreeID } from "loro-crdt";
import { taskTag, type FractosTaskElement } from "./task";
import { BaseEditor } from "../class/base";
import { Transaction } from "@codemirror/state";
import type { EditorView } from "codemirror";
import type { CircularProgress } from "./circular-progress";


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
    <circular-progress class="${projectElements.percentage.class}" percent="0"></circular-progress>
    <div>
        <h2 class="${projectElements.title.class}"></h2>
        <p class="${projectElements.description.class}"></p>
    </div>
  </div>
  <div class="${projectElements.children.class}"></div>
`;

export class FractosProjectElement extends HTMLElement implements Node<'project'> {
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __description: HTMLElement;
  private __percentage: CircularProgress;
  private __children: HTMLElement;
  private __focus: HTMLElement;

  private cmTitle: EditorView;
  private cmDescription: EditorView;
  
  private state?: FractosState;
  override tagName: string = projectTag;
  
  type = "project" as const;
  compositor: Compositor;
  showChildren: boolean = true;
  
  get treeid() { return this.dataset.treeid as TreeID };
  get element() { return this }
  get tasks() { return this.__children }
  get isEditing() { return this.cmTitle.hasFocus || this.cmDescription.hasFocus }
  
  constructor() { super()
    
    this.__root = document.createElement('div');
    this.__root.innerHTML = innerHTML;
    this.__root.classList.add(projectElements.root.class);
    
    this.__title = this.__root.querySelector(projectElements.title.class.dot) as HTMLElement;
    this.__focus = this.__root.querySelector(projectElements.focus.class.dot) as HTMLElement;
    this.__description = this.__root.querySelector(projectElements.description.class.dot) as HTMLElement;
    this.__percentage = this.__root.querySelector(projectElements.percentage.class.dot) as CircularProgress;
    this.__children = this.__root.querySelector(projectElements.children.class.dot) as HTMLElement;

    this.cmTitle = this.titleEditor(this.__title);
    this.cmDescription = this.descriptionEditor(this.__description);

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
    this.cmTitle.dispatch({
      changes: { from: 0, insert: title, to: this.cmTitle.state.doc.length },
      annotations: [ Transaction.addToHistory.of(false) ]
    })
  }
  
  setPercetage = (percentage: number) => {
    this.__percentage.percent = '' + percentage
  }
  
  setDescription = (description: string) => {
    this.cmDescription.dispatch({
      changes: { from: 0, insert: description, to: this.cmDescription.state.doc.length },
      annotations: [ Transaction.addToHistory.of(false) ]
    })
  }

  private update(data: {
    title?: string,
    description?: string,
  }) {
    this.state?.update({
      type: "task",
      id: this.treeid,
      ...data,
    })
  }
  
  titleEditor(element: HTMLElement) {
      return BaseEditor(element, {
        onConfirm: (view, inital) => { 
          const text = view.state.doc.toString();
          if (text !== '' && text !== inital) this.update({ title: text })
          this.focus()
          return;
        },
        onCancel: (_, inital) => {
          this.setTitle(inital)
          this.focus()
          return;
        },
      },
      {
        comfirmOnFocusout: false,
        onlineEditor: true,
        placeholder: 'Project title...',
        focusOnDblClick: true,
      });
  }

  descriptionEditor(element: HTMLElement) {
      return BaseEditor(element, {
        onConfirm: (view, inital) => { 
          const text = view.state.doc.toString();
          if (text !== '' && text !== inital) this.update({ description: text })
          this.focus()
          return;
        },
        onCancel: (_, inital) => {
          this.setDescription(inital)
          this.focus()
          return;
        },
      },
      {
        comfirmOnFocusout: false,
        placeholder: 'Project description...',
        focusOnDblClick: true,
      });
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
