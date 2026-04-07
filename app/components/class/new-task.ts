import { EditorSelection, EditorState } from "@codemirror/state";
import { placeholder } from "@codemirror/view";
import { createKeybindingsHandler } from "@glifox/desmos";
import { EditorView, minimalSetup } from "codemirror";
// import { Task } from "./task";

export type Callbacks = {
  onConfirm: (view: EditorView) => void,
  onCancel: (view: EditorView) => void,
}

export class NewTask {
  __root: HTMLElement;
  private cm: EditorView;
  
  constructor(callbacks: Callbacks) {
    this.__root = document.createElement("div");
    this.__root.innerHTML = "Task.innerHTML";
    
    this.cm = Editor(this.__root.querySelector(".--ts-title")!, callbacks)
  }
  
  focus() { this.cm.focus() }
}

export const Editor = (
  parent: HTMLElement,
  callbacks: Callbacks,
) => {
  let forced_focus_out = false;
  
  const keyup_ = createKeybindingsHandler({
    'enter': (_, v: EditorView) => {
      forced_focus_out = true
      v.contentDOM.blur()
      callbacks.onConfirm(v)
      return;
    }
  })
  
  const view = new EditorView({
    doc: ``,
    extensions: [
      minimalSetup,
      EditorState.transactionFilter.of(
        tr => tr.newDoc.lines > 1 ? [] : [tr]
      ),
      placeholder("Task title..."),
      EditorView.domEventHandlers({
        'keyup': keyup_,
        'focusout': (_, v) => {
          v.dispatch({ selection: EditorSelection.cursor(0) })
          if (forced_focus_out) {
            forced_focus_out = false
            return false
          }
          callbacks.onCancel(v)
        }
      })
    ],
    parent,
  });
  
  view.focus();

  return view;
}
