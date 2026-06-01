class FitInput extends HTMLInputElement {
  constructor() {
    super();
    this._adjustWidth = this._adjustWidth.bind(this);
  }

  connectedCallback() {
    this.addEventListener('input', this._adjustWidth);
    this._adjustWidth();
  }

  disconnectedCallback() {
    this.removeEventListener('input', this._adjustWidth);
  }

  _adjustWidth() {
    const value = this.value || this.placeholder || '';
    
    const span = document.createElement('span');
    
    const style = window.getComputedStyle(this);
    span.style.fontSize = style.fontSize;
    span.style.fontFamily = style.fontFamily;
    span.style.fontWeight = style.fontWeight;
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    
    span.textContent = value;
    document.body.appendChild(span);
    this.style.width = `${span.offsetWidth}px`;
    
    document.body.removeChild(span);
  }
}

customElements.define('fit-input', FitInput, { extends: 'input' });
