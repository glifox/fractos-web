import { type Node, type Compositor, type ProjectData, type FractosNode, FractosView } from "@glifox/fractos";
import type { TreeID } from "loro-crdt";
import { marked } from "marked";

class NoneCompositor implements Compositor {
  length: number = 0;
  addChangeListener(callback: (action: "insert" | "delete" | "move") => void): () => boolean {
      throw new Error("Method not implemented.");
  }
  get parent(): HTMLElement { throw new Error("Method not implemented.") };
  
  push(node: Node<"project" | "task">): void {
    throw new Error("Method not implemented.");
  }
  pop(): Node<"project" | "task"> | undefined {
    throw new Error("Method not implemented.");
  }
  delete(treeid: `${number}@${number}`): Node<"project" | "task"> | undefined {
    throw new Error("Method not implemented.");
  }
  insert(node: Node<"project" | "task">, index: number | null): void {
    throw new Error("Method not implemented.");
  }
  move(treeid: `${number}@${number}`, index: number, oldindex: number): void {
    throw new Error("Method not implemented.");
  }
  get(index: number): Node<"project" | "task"> | undefined {
    throw new Error("Method not implemented.");
  }
}

export class SideProject implements Node<'project'> {
  type = "project" as const;
  
  treeid: TreeID;
  element: HTMLElement;
  compositor: Compositor = new NoneCompositor();
  showChildren: boolean = false;
  private percentage : HTMLSpanElement;
  private title : HTMLSpanElement;
  
  constructor(private view: () => FractosView | null, node: FractosNode) {
    this.treeid = node.treeid;
    this.element = document.createElement('button');
    this.element.classList.add('side-project');
    this.element.dataset.treeid = this.treeid;

    this.title = document.createElement('span');
    this.percentage = document.createElement(`span`);

    this.element.append(this.title, this.percentage);

    this.setTitle(node.get('title'));
    this.setPercentage(`${node.get('percentage') ?? 0}`);
    
    this.element.addEventListener('click', () => {
      const view = this.view();
      if (!view) return;
      
      view.setMode({ type: "selected", project: this.treeid })
    })
  }
  
  set<P extends keyof ProjectData>(key: keyof ProjectData, value: ProjectData[P]): void {
    if (key === 'title') this.setTitle(value);
    // @ts-ignore
    if (key === 'percentage') this.setPercentage(value);
  }

  setTitle(text: string) {
    this.title.innerHTML = marked.parseInline(text, { silent: true }).toString();
  }

  setPercentage(percentage: string) {
    const percentage_ = parseInt(percentage);
    this.percentage.innerText = (percentage_ != 100) ? `${percentage_}%` : '✔';
  }
  
  updateIndex(): void { }
} 

