// Timer Web Worker for background timing
let interval: NodeJS.Timeout | null = null;
let startTime: number = 0;
let isRunning = false;

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'START':
      if (!isRunning) {
        startTime = Date.now();
        isRunning = true;
        
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          self.postMessage({ type: 'TICK', elapsed });
        }, 1000);
        
        self.postMessage({ type: 'STARTED' });
      }
      break;
      
    case 'STOP':
      if (isRunning) {
        isRunning = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        self.postMessage({ type: 'STOPPED', elapsed });
      }
      break;
      
    case 'GET_TIME':
      if (isRunning) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        self.postMessage({ type: 'TIME', elapsed });
      } else {
        self.postMessage({ type: 'TIME', elapsed: 0 });
      }
      break;
  }
};