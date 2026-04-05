import "../web/linear-progress";
import { NewTask } from "./new-task";

import { EditorView, minimalSetup } from "codemirror";
import { Transaction } from "@codemirror/state";
import { EditorSelection, EditorState } from "@codemirror/state";
import { createKeybindingsHandler } from "@glifox/desmos";

import type { FractosState, Metadata, TaskData } from "fractos";
import type { TreeID } from "loro-crdt";


type TaskElement =
  "root" |
  "title" |
  "content" |
  "checkbox" |
  "percentage" |
  "tasks";

export class Task {  
  private __root: HTMLElement;
  private __title: HTMLElement;
  private __content: HTMLElement;
  private __checkbox: HTMLElement;
  private __percentage: HTMLElement;
  private __tasks: HTMLElement;
  
  private cmTitle: EditorView;
  private _percentage: number = 0;
  get percentage() { return this._percentage }
  
  constructor(private id: TreeID, private state: FractosState) {
    this.__root = document.createElement('div');
    this.__root.classList.add("--ts-root");
    this.__root.innerHTML = this.innerHTML;
    
    this.__title = this.__root.querySelector(".--ts-title")! as HTMLElement;
    this.__content = this.__root.querySelector(".--ts-content")! as HTMLElement;
    this.__checkbox = this.__root.querySelector(".--ts-checkbox")! as HTMLElement;
    this.__percentage = this.__root.querySelector(".--ts-progress") as HTMLElement;
    this.__tasks = this.__root.querySelector(".--ts-childs") as HTMLElement;
    
    this.__tasks.dataset.treeid = id;
    
    this.set_events();
    this.cmTitle = Editor(
      this.__title,
      _ => {
        this.__content.focus()
        this.updateTitle()
    });
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
      content: this.__content,
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
    <div class="--ts-content" tabindex="0">
        <input class="--ts-checkbox" type="checkbox"/>
        <h3 class="--ts-title"></h3>
        <linear-progress class="--ts-progress"></linear-progress>
    </div>
    <div class="--ts-childs" style="padding-left: 16px"></div>
  `;
  
  
  private events: { [Z in TaskElement]?: { [K in keyof HTMLElementEventMap]?: EventListener } } = {
    'checkbox': {
      'click': (_) => this._toggle_check()
    },
    'content': {
      'keydown': (e) => {
        if (this.cmTitle.hasFocus) return;
        this.__content_keybindings(e)
      }
    }
  }
  
  // Key-events
  private __content_keybindings = createKeybindingsHandler({
    'enter': (e) => {
      const newTask = new NewTask({
        onConfirm: (v) => {
          this._create_new_task({
            title: v.state.doc.toString(),
            description: "No description"
          })
          newTask.__root.remove()
        },
        onCancel: () => {
          newTask.__root.remove()
        }
      });
      document.body.appendChild(newTask.__root);
      e.stopImmediatePropagation()
      e.stopPropagation()
    },
    'tab': (e) => {
      e.preventDefault()
      this._focus_next_task()
    },
    'shift-tab': (e) => {
      e.preventDefault()
      this._focus_previous_task()
    },
    'ArrowDown': (e) => {
      e.preventDefault()
      this._focus_next_task()
    },
    'ArrowUp': (e) => {
      e.preventDefault()
      this._focus_previous_task()
    },
    'Space': (e) => {
      e.preventDefault()
      this._toggle_check(true)
    },
    'ctrl-ArrowDown': (e) => {
      e.preventDefault()
      this._change_percentage("down")
    },
    'ctrl-ArrowUp': (e) => {
      e.preventDefault()
      this._change_percentage("up")
    },
  })
  
  // Actions
  private _focus_next_task() {
    if (this.__tasks.children.length > 0) {
      // @ts-ignore
      this.__tasks.firstChild.querySelector('.--ts-content').focus()
      return
    }
    
    const __sibling = this.__root.nextElementSibling;
    if (__sibling && __sibling.classList.contains("--ts-root")) {
      // @ts-ignore
      __sibling.querySelector('.--ts-content').focus()
      return
    }
    
    const parent = this.__root.parentElement?.closest(".--ts-root");
    if (!parent) return
    
    const parentSibling = parent.nextElementSibling;
    if (!parentSibling) return
    
    // @ts-ignore
    parentSibling.querySelector('.--ts-content').focus()
  }
  
  private _focus_previous_task() {
    const __prev_sibling = this.__root.previousElementSibling;
    if (
      !__prev_sibling ||
      !__prev_sibling.classList.contains("--ts-root")
    ) {
      const __parent_root = this.__root.parentElement?.parentElement;
      
      if (__parent_root && __parent_root.classList.contains("--ts-root")) {
        // @ts-ignore
        __parent_root.querySelector('.--ts-content').focus()
      }
      
      return
    }
    
    const __tasks = __prev_sibling.querySelector('.--ts-childs');
    if (__tasks && __tasks.children.length > 0) {
      // @ts-ignore
      __tasks.lastChild.querySelector('.--ts-content').focus()
      return
    }
    
    // @ts-ignore
    __prev_sibling.querySelector('.--ts-content').focus()
  }
  
  private _toggle_check(invert: boolean = false) {
    if (invert !== (this.__checkbox as HTMLInputElement).checked) this.state.update({ type: "task", percentage: 100, id: this.id })
    else this.state.reCalculatePercentage(this.id);
  }
  
  private _change_percentage(mode: "up" | "down", step: number = 10) {
    if (this.__tasks.childElementCount > 0) return;
    
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
        id: this.id,
        type: "task",
        percentage,
      })
      console.info("percentage:", percentage);
    }
  }
  
  private _create_new_task(data: TaskData) {
    const parent = this.__root.parentElement?.closest(".--ts-childs");
    if (!parent) return
    
    const id = (parent as HTMLElement).dataset.treeid as TreeID;
    this.state.createTask(data, id);
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
            forced_focus_out = true
            v.contentDOM.blur()
            onConfirm(v)
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
