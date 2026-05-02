import { createKeybindingsHandler } from "@glifox/desmos";
import { EditorView, minimalSetup } from "codemirror";
import { EditorSelection, EditorState } from "@codemirror/state";
import { keymap, placeholder } from "@codemirror/view";
import { gnosis } from "@glifox/gnosis";

export type Callbacks = {
  onConfirm: (view: EditorView, initialValue: string) => void,
  onCancel?: (view: EditorView, initialValue: string) => void,
}

export const BaseEditor = (
  parent: HTMLElement,
  callbacks: Callbacks,
  options?: {
    placeholder?: string,
    comfirmOnFocusout?: boolean,
    focusOnDblClick?: boolean,
    onlineEditor?: boolean,
  }
) => {
  let forced_focus_out = false;
  let initalValue = '';
  
  const confirm = (e: KeyboardEvent, v: EditorView) => {
    forced_focus_out = true
    v.contentDOM.blur()
    if (v.state.doc.length > 0) callbacks.onConfirm(v, initalValue)
    else if (callbacks.onCancel) callbacks.onCancel(v, initalValue)
    e.stopImmediatePropagation()
    return true;
  }
  
  const confirmKey = (options?.onlineEditor) ? 'enter': 'ctrl-enter';
  
  const keyup_ = createKeybindingsHandler<[EditorView]>({
    [confirmKey]: confirm 
  })
  
  const oneline = (options?.onlineEditor)
    ? EditorState.transactionFilter
      .of(tr => tr.newDoc.lines > 1 ? [] : [tr])
    : [];
  
  const view = new EditorView({
    doc: ``,
    extensions: [
      keymap.of([ { key: "Ctrl-Enter", run: () => true, } ]),
      minimalSetup,
      EditorView.lineWrapping,
      oneline,
      gnosis(),
      placeholder(options?.placeholder ?? ""),
      EditorView.domEventHandlers({
        'mousedown': (e, v) => {
          if (options?.focusOnDblClick) {
            if (v.hasFocus) return false
            e.preventDefault()
            return true
          }
        },
        'dblclick': (e, v) => {
          if (options?.focusOnDblClick) {
            if (v.hasFocus) return false
            e.preventDefault()
            
            v.focus()
            const pos = v.posAtCoords({
              x: e.clientX,
              y: e.clientY,
            }, false)
            v.dispatch({ selection: EditorSelection.cursor(pos) })
            
            return true
          }
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
