class LinearProgress extends HTMLElement {
  static get observedAttributes() { return ['data-percentage']; }
  private __progress: HTMLSpanElement
  private __number: HTMLSpanElement
  
  constructor() {
    super();
    // this.attachShadow({ mode: 'open' });

    this.innerHTML = /* html */`
      <span class="progress"></span>
      <span class="number"></span>
    `;

    this.classList.add('progress-bar')
    
    this.__progress = this.querySelector('.progress')!!;
    this.__number = this.querySelector('.number')!!;
  }

  connectedCallback() { this.updateProgress(); }

  attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown) {
    if (
      name === 'data-percentage' &&
      oldValue !== newValue
    ) this.updateProgress();
  }

  updateProgress() {
    const percentage = parseFloat(this.getAttribute('data-percentage') || '0');
    const textValue = `${percentage.toFixed(1)}%`;

    this.__number.textContent = textValue;
    this.__progress.setAttribute('data-text', textValue);
    this.__progress.style.setProperty('--percentage-width', `${percentage}%`);
  }
}

customElements.define('linear-progress', LinearProgress);
