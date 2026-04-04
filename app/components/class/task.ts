import "../web/linear-progress";

import { EditorView, minimalSetup } from "codemirror";
import { Transaction } from "@codemirror/state";
import { EditorSelection, EditorState } from "@codemirror/state";

import type { FractosState } from "fractos";
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
  
  private cmTitle: EditorView;
  
  constructor(private id: TreeID, private state: FractosState) {
    this.__root = document.createElement('div');
    this.__root.classList.add("--ts-root");
    this.__root.innerHTML = this.innerHTML;
    
    this.__title = this.__root.querySelector(".--ts-title")! as HTMLElement;
    this.__checkbox = this.__root.querySelector(".--ts-checkbox")! as HTMLElement;
    this.__percentage = this.__root.querySelector(".--ts-progress") as HTMLElement;
    this.__tasks = this.__root.querySelector(".--ts-childs") as HTMLElement;
    
    this.cmTitle = Editor(this.__title, _ => this.updateTitle());
    this.set_events();
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
  }
  
  private updateTitle() {
    this.state.update({
      id: this.id,
      type: "task",
      title: this.cmTitle.state.doc.toString(),
    })
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
    <div class="--ts-childs" style="padding-left: 16px"></div>
  `;
  
  
  private events: { [Z in TaskElement]?: { [K in keyof HTMLElementEventMap]?: EventListener } } = {
    'checkbox': {
      'click': (_) => {
        if ((this.__checkbox as HTMLInputElement).checked) this.state.update({ type: "task", percentage: 100, id: this.id })
        else this.state.reCalculatePercentage(this.id);
      }
    }
  }
}

const Editor = (parent: HTMLElement, onConfirm: (view: EditorView) => void) => {
  let forced_focus_out = false;
  
  const view = new EditorView({
    doc: `[vacio]`,
    extensions: [
      minimalSetup,
      EditorState.transactionFilter.of(
        tr => tr.newDoc.lines > 1 ? [] : [tr]
      ),
      EditorView.domEventHandlers({
        'mousedown': (e, v) => {
          if (v.hasFocus) return false;
          e.preventDefault();
          return true;
        },
        'dblclick': (e, v) => {
          if (v.hasFocus) return false;
          e.preventDefault();
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }, false)
          view.focus();
          view.dispatch({ selection: EditorSelection.cursor(pos || 0), scrollIntoView: true });
          return false;
        },
        'keyup': (e, v) => {
          if (e.key === "Enter") {
            onConfirm(v)
            forced_focus_out = true
            v.contentDOM.blur()
            return;
          }
        },
        'focusout': (_, v) => {
          v.dispatch({ selection: EditorSelection.cursor(0) })
          if (forced_focus_out) {
            forced_focus_out = false
            return false
          }
          onConfirm(v)
        }
      })
    ],
    parent,
  });

  return view;
}
