class LinearProgress extends HTMLElement {
  static get observedAttributes() { return ['data-percentage']; }
  private __progress: HTMLDivElement
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot!.innerHTML = /* html */`
      <style>
        :host {
          --lp-bg: white;
          --lp-fill: gray;
          --lp-text: black;
          --lp-text-fill: white;
          --lp-border-color: transparent;
          --lp-border-width: 0;
          --lp-width: 5rem;
          --lp-height: 1.2lh;
          --lp-duration: 0.4s;

          display: inline-block;
          vertical-align: middle;
        }

        .progress {
          display: inline-flex;
          align-items: center;
          position: relative;
          
          background-color: var(--lp-bg);
          color: var(--lp-text);
          border-radius: 999px;
          border: var(--lp-border-width) solid var(--lp-border-color);
          
          width: var(--lp-width);
          height: var(--lp-height);
          font-size: 0.8rem;
          white-space: nowrap;
          padding-left: 0.5rem;
          
          box-sizing: border-box;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .progress::before {
          display: inline-flex;
          align-items: center;
          padding-left: 0rem;
          
          color: var(--lp-text-fill);
          overflow: hidden;
          content: attr(data-text);
          position: absolute;
          background-color: var(--lp-fill);
          pointer-events: none;
          
          top: 0;
          left: 0;
          
          width: var(--percentage-width, 0%);
          height: 100%;
          transition: width var(--lp-duration) cubic-bezier(0.4, 0, 0.2, 1);
          
          box-sizing: border-box;
          z-index: 0;
        }
      </style>
      <div class="progress"></div>
    `;
    
    this.__progress = this.shadowRoot!.querySelector('.progress')!!;
  }

  connectedCallback() { this.updateProgress(); }

  attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown) {
    if (
      name === 'data-percentage' &&
      oldValue !== newValue
    ) this.updateProgress();
  }

  updateProgress() {
    const percentage = this.getAttribute('data-percentage') || '0';
    const textValue = `${percentage}%`;

    this.__progress.textContent = textValue;
    this.__progress.setAttribute('data-text', textValue);
    this.__progress.style.setProperty('--percentage-width', `${percentage}%`);
  }
}

customElements.define('linear-progress', LinearProgress);
