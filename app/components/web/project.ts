import type { FractosState } from "fractos";
import type { TreeID } from "loro-crdt";


export const projectElements = {
  root: { class: "--pr-root" },
  title: { class: "--pr-title" },
  description: { class: "--pr-description" },
  percentage: { class: "--pr-percentage" },
  children: { class: "--pr-children" },
} as const;

const innerHTML = /* html */`
  <h2 class="${projectElements.title.class}"></h2>
  <span class="${projectElements.percentage.class}"></span>
  <p class="${projectElements.description.class}"></p>
  <div class="${projectElements.children.class}"></div>
`;

export class FractosProjectElement extends HTMLElement {
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __description: HTMLElement;
  private __percentage: HTMLElement;
  private __children: HTMLElement;
  
  private state?: FractosState;
  
  get treeid() { return this.id as TreeID };
  get root() { return this }
  get tasks() { return this.__children }
  
  constructor() { super()
    this.__root = document.createElement('div');
    this.__root.innerHTML = innerHTML;
    this.__root.classList.add(projectElements.root.class);
    
    this.__title = this.__root.querySelector(projectElements.title.class.dot) as HTMLElement;
    this.__description = this.__root.querySelector(projectElements.description.class.dot) as HTMLElement;
    this.__percentage = this.__root.querySelector(projectElements.percentage.class.dot) as HTMLElement;
    this.__children = this.__root.querySelector(projectElements.children.class.dot) as HTMLElement;
  }
  
  init(state: FractosState) {
    this.state = state;
    this.appendChild(this.__root);
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
}

export const projectTag = 'fractos-project';
customElements.define(projectTag, FractosProjectElement);
export { };
