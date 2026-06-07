

const observedAttributes = ["status", "label", "target"] as const;
const validStatus = ['muted', 'error', 'warning', 'success'] as const;

export type StatusButtonType = typeof validStatus[number];

const style = /* css */`
  button {
    border-radius: 999px;
    border: none;
    outline: none;
  
    display: flex;
    justify-content: center;
    align-items: center;
  
    font-size: .76rem;
  
    padding-inline: 8px;
    gap: 4px;
  
    & svg {
      width: 1.2rem;
      
    }
  
    &.error {
      background-color: var(--sm-bg-error);
      color: var(--sm-fg-error);
    }
  
    &.warning {
      background-color: var(--sm-bg-warning);
      color: var(--sm-fg-warning);
    }
  
    &.success {
      background-color: var(--sm-bg-success);
      color: var(--sm-fg-success);
    }
  
    &.muted {
      background-color: var(--sm-bg-info);
      color: var(--sm-fg-info);
    }
  
    &.success, &.muted {
      & span { display: none; }
  
      &:hover span {
        animation: slidein 300ms;
        display: inline;
      }
    }
  
    &:hover {
      background-color: oklch(from currentColor l c h / .11);
    }
  }
  
  @keyframes slidein {
    from { display: none; opacity: 0; transform: translateX(100%); }
    45% { opacity: 0; }
    to { display: inline; transform: translateX(0); opacity: 1;}
  }`;

const cloud = '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>';
const slashedCloud = '<path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/>';

class StatusButton extends HTMLElement {
  static observedAttributes = observedAttributes;
  private _status: StatusButtonType = "muted";
  private _label: string = "";
  private _target: string = "";

  private button: HTMLButtonElement;
  private span: HTMLSpanElement;
  private svg: HTMLElement;

  constructor() { super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot!.innerHTML = /* html */`
      <style>${style}</style>
      <button id="bt" class="${this.status}">
        <span id="sp">${this.label}</span>
        <svg id="sv" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
        >${this.path}</svg>
      </button>
    `;

    this.button = this.shadowRoot?.getElementById('bt') as HTMLButtonElement;
    this.span = this.shadowRoot?.getElementById('sp') as HTMLSpanElement;
    this.svg = this.shadowRoot?.getElementById('sv') as HTMLElement;

    this.button.addEventListener('click', _ => {
      document.getElementById(this._target)?.showPopover()
    });
  }

  private get path() { 
    return (this.status === 'success') ? cloud : slashedCloud;
  }

  get label() { return this._label }
  get status() { return this._status }

  set label(label: string) {
    this._label = label;
    this.span.innerText = label;
  }
  set status(status: StatusButtonType) {    
    const old = this._status;
    this._status = status;
    this.button.classList.replace(old, this._status);
    this.svg.innerHTML = this.path;
  }

  changeState(status: StatusButtonType, label: string) {
    this.status = status
    this.label = label
  }
  
  attributeChangedCallback(name: typeof observedAttributes[number], oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    if (name === 'label') {
      this.label = newValue
      return;
    }

    if (name === 'status') {
      let status = newValue;

      if (
        !(validStatus as unknown as string[]).includes(status)
      ) status = 'muted';

      this.status = status as StatusButtonType;
      return;
    }

    if (name === 'target') {
      this._target = newValue;
      return;
    }
    
    this.button.setAttribute(name, newValue)
  }
}

customElements.define('status-button', StatusButton);