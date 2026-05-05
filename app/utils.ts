export const startTimer = (oncomplete: () => void, duration: number) => {
  let timeoutId: number | null = null;
  const startTime = Date.now();
  
  const timeoutHandler = () => {
    if (Date.now() - startTime >= duration) {
      oncomplete();
      window.cancelAnimationFrame(timeoutId!);
    } else {
      timeoutId = requestAnimationFrame(timeoutHandler);
    }
  };

  timeoutId = requestAnimationFrame(timeoutHandler);
}

export const domReady = new Promise(resolve => {
  if (document.readyState === 'interactive' || document.readyState === 'complete') resolve('');
  else document.addEventListener('DOMContentLoaded', () => resolve(''));
});

export function downloadContent(content: any) {
  const cleanUint8Array = new Uint8Array(content); 
  const blob = new Blob([cleanUint8Array], { type: 'application/octet-stream' });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'fractos.loro';

  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
