import { type Node, type Compositor, type ProjectData, FractosState, type FractosNode } from "fractos";
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
  
  constructor(private state: FractosState, node: FractosNode) {
    this.treeid = node.treeid;
    this.element = document.createElement('div');
    this.element.innerText = node.get('title');
  }
  
  set<P extends keyof ProjectData>(key: keyof ProjectData, value: ProjectData[P]): void {
    if (key === 'title') this.element.innerText = value;
  }
  
  updateIndex(): void { }
} 

