import { createKeybindingsHandler } from "@glifox/desmos";
import { EditorView, minimalSetup } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { placeholder } from "@codemirror/view";
import { gnosis } from "@glifox/gnosis";

export type Callbacks = {
  onConfirm: (view: EditorView, initialValue: string) => void,
  onCancel?: (view: EditorView, initialValue: string) => void,
}

export const TitleEditor = (
  parent: HTMLElement,
  callbacks: Callbacks,
  options?: {
    comfirmOnFocusout?: boolean
  }
) => {
  let forced_focus_out = false;
  let initalValue = '';
  
  const keyup_ = createKeybindingsHandler<[EditorView]>({
    'enter': (e, v) => {
      forced_focus_out = true
      v.contentDOM.blur()
      if (v.state.doc.length > 0) callbacks.onConfirm(v, initalValue)
      else if (callbacks.onCancel) callbacks.onCancel(v, initalValue)
      e.stopImmediatePropagation()
      return true;
    }
  })
  
  const view = new EditorView({
    doc: ``,
    extensions: [
      minimalSetup,
      EditorState.transactionFilter.of(
        tr => tr.newDoc.lines > 1 ? [] : [tr]
      ),
      gnosis(),
      placeholder("Task title..."),
      EditorView.domEventHandlers({
        'mousedown': (e, v) => {
          if (v.hasFocus) return false
          e.preventDefault()
          return true
        },
        'dblclick': (e, v) => {
          if (v.hasFocus) return false
          e.preventDefault()
          
          v.focus()
          const pos = v.posAtCoords({
            x: e.clientX,
            y: e.clientY,
          }, false)
          v.dispatch({ selection: EditorSelection.cursor(pos) })
          
          return true
        },
        'keyup': keyup_,
        'focusin': (_, v) => {
          initalValue = v.state.doc.toString();
        },
        'focusout': (_, v) => {
          v.dispatch({ selection: EditorSelection.cursor(0) })
          if (forced_focus_out) {
            forced_focus_out = false
            return false
          }
          if (options?.comfirmOnFocusout) callbacks.onConfirm(v, initalValue)
          else if (callbacks.onCancel) callbacks.onCancel(v, initalValue)
        }
      })
    ],
    parent,
  });

  return view;
}
