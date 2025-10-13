import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    renderStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const totalMountTime = performance.now() - mountTime.current;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          totalMountTime: `${totalMountTime.toFixed(2)}ms`,
          memoryUsage: (performance as any).memory ? {
            used: `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`,
            total: `${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB`
          } : 'Not available'
        });
      }
    };
  }, [componentName]);

  const measureRender = (callback: () => void) => {
    renderStartTime.current = performance.now();
    callback();
  };

  return { measureRender };
}
