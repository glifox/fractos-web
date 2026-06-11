import { json } from "@codemirror/lang-json";
import { EditorView, basicSetup } from "codemirror";
import { Compartment, Transaction } from "@codemirror/state";
import { catppuccinLatte, catppuccinMocha } from "@catppuccin/codemirror";


const themeConfig = new Compartment();
const theme_ = (dark: boolean) => dark ? catppuccinMocha : catppuccinLatte;

const editorView = (text: string, parent: HTMLElement) => {
  const current = (document.documentElement.getAttribute('theme') ?? "ligth") === "dark";
  const theme = theme_(current);

  document.addEventListener('th-changed', (e) => {
    view.dispatch({
      // @ts-ignore
      effects: themeConfig.reconfigure(theme_(e.detail.theme === "dark"))
    })
  })
  
  const view = new EditorView({
    doc: text,
    extensions: [
      json(),
      basicSetup,
      EditorView.editable.of(false),
      themeConfig.of(theme),
    ],
    parent: parent,
  });

  return view;
};

export const Editor = (text: string | object, parent: HTMLElement) => {
  const text_ = (typeof text === 'string') ? text : JSON.stringify(text, null, 2); 
  const view = editorView(text_, parent);

  return {
    view,
    setText(text: string | object) {
      view.dispatch({
        changes: {
          from: 0, to: view.state.doc.length,
          insert: (typeof text === 'string') ? text : JSON.stringify(text, null, 2),
        },
        annotations: [ Transaction.addToHistory.of(false) ]
      })
    },
    getText() { return view.state.doc.toString() }
  }
}