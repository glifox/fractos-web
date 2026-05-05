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