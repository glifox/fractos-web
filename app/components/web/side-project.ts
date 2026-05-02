import { type Node, type Compositor, type ProjectData, type FractosNode, FractosView } from "fractos";
import type { TreeID } from "loro-crdt";

class NoneCompositor implements Compositor {
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
  
  constructor(private view: FractosView, node: FractosNode) {
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
      this.view.setMode({
        type: "selected",
        project: this.treeid,
      })

      const prs = document.querySelectorAll('.side-project.active')
      prs.forEach((__element) => __element.classList.remove('active'))
      this.element.classList.add('active')
    })
  }
  
  set<P extends keyof ProjectData>(key: keyof ProjectData, value: ProjectData[P]): void {
    if (key === 'title') this.setTitle(value);
    // @ts-ignore
    if (key === 'percentage') this.setPercentage(value);
  }

  setTitle(text: string) {
    this.title.innerText = text;
  }

  setPercentage(percentage: string) {
    const percentage_ = parseInt(percentage);
    this.percentage.innerText = (percentage_ != 100) ? `${percentage_}%` : '✔';
  }
  
  updateIndex(): void { }
} 

