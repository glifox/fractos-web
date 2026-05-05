
export class CircularProgress extends HTMLElement {
  private _progressBar: HTMLElement;
  private _percentLabel: HTMLElement;
  private _radius: number;
  private _circumference: number;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot!.innerHTML = /*html*/`
      <style>
        :host {
          display: inline-block;
          width: 90px;
          height: 90px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .progress-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }
        
        .circle-bg {
          fill: none;
          stroke: #dbe1eb;
          stroke-width: 8;
        }
        
        .circle-progress {
          fill: none;
          stroke: var(--circular-color);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.3s ease-in-out;
        }
        
        .percentage-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22px;
          font-weight: 600;
          color: var(--fg-text);
        }
      </style>

      <div class="progress-container">
        <svg viewBox="0 0 100 100">
          <circle class="circle-bg" cx="50" cy="50" r="42"></circle>
          <circle class="circle-progress" id="progress-bar" cx="50" cy="50" r="42"></circle>
        </svg>
        <div class="percentage-text" id="percent-label">0%</div>
      </div>
    `;

    this._progressBar = this.shadowRoot!.querySelector('#progress-bar')!;
    this._percentLabel = this.shadowRoot!.querySelector('#percent-label')!;
    
    this._radius = 42;
    this._circumference = 2 * Math.PI * this._radius;
    this._progressBar.style.strokeDasharray = `${this._circumference}`;
  }

  static get observedAttributes() {
    return ['percent'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'percent' && oldValue !== newValue) {
      const percent = Math.min(Math.max(parseInt(newValue, 10) || 0, 0), 100);
      const offset = this._circumference - (percent / 100) * this._circumference;
      
      this._progressBar.style.strokeDashoffset = ''+offset;
      this._percentLabel.textContent = `${percent}%`;
    }
  }

  get percent() { return this.getAttribute('percent'); }
  set percent(val) { this.setAttribute('percent', val ?? '0'); }
}

customElements.define('circular-progress', CircularProgress);
