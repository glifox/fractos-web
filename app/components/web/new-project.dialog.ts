import type { EditorView } from "codemirror";
import { BaseEditor } from "../class/base";
import type { FractosState } from "fractos";


const elementTag = 'new-project' as const;
export class NewProjectDialog extends HTMLElement {
  static get observedAttributes() { return ['id']; }
  attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown) {
    if (
      name === 'id' &&
      oldValue !== newValue
    ) this.__cancel.setAttribute('popovertarget', ''+newValue);
  }
  override tagName: string = elementTag;
  
  private _title: EditorView;
  private _description: EditorView;
  
  private __titleInput: HTMLElement;
  private __descriptionInput: HTMLElement;
  private __confirm: HTMLElement;
  private __cancel: HTMLElement;
  
  private state?: FractosState;
  
  constructor() { super()
    
    this.innerHTML = /* html */`
        <div>
          <span>Title:</span>
          <h3 class="editor title"></h3>
        </div>
        <div>
          <span>Description:</span>
          <div class="editor description"></div>
        </div>
        <footer>
          <button class="cancel" popovertargetaction="hide">Close</button>
          <button class="confirm">Create</button>
        </footer>
      `;
    
    this.__titleInput = this.querySelector(".title")!;
    this.__descriptionInput = this.querySelector(".description")!;
    this.__confirm = this.querySelector(".confirm")!;
    this.__cancel = this.querySelector(".cancel")!;
    
    this._title = BaseEditor(
      this.__titleInput,
      {
        onConfirm: (v) => { v.contentDOM.blur() },
        onCancel: () => { },
      },
      {
        comfirmOnFocusout: true,
        onlineEditor: true,
        placeholder: 'Project title',
      },
    )
    
    this._description = BaseEditor(
      this.__descriptionInput,
      {
        onConfirm: (v) => { v.contentDOM.blur() },
        onCancel: () => { },
      },
      {
        comfirmOnFocusout: true,
      },
    )
    
    this.__confirm.addEventListener('click', () => {
      if (!this.state) return
      
      const title = this._title.state.doc.toString();
      const description = this._description.state.doc.toString();
      
      if (title === '') this.__titleInput.classList.add('empty')
      if (description === '') this.__titleInput.classList.add('empty')
      
      if (title === '' || description === '') return
      
      this.state.create({
        title,
        description,
        type: "project",
      })
      
      this.hidePopover()
    })
  }
  
  init(state: FractosState) { this.state = state }
  
}

customElements.define(elementTag, NewProjectDialog);
export { };

