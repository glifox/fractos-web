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
    const percentage = parseInt(this.getAttribute('data-percentage') || '0');
    const textValue = `${percentage} %`;

    this.__number.textContent = textValue;

    if (percentage == 100) this.__number.classList.add('done')
    else this.__number.classList.remove('done')
    
    this.__progress.setAttribute('data-text', textValue);
    this.__progress.style.setProperty('--percentage-width', `${percentage}%`);
  }
}

customElements.define('linear-progress', LinearProgress);
