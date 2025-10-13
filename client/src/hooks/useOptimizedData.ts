import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface UseOptimizedDataOptions {
  ttl?: number; // Cache time to live (default: 5 minutes)
  retryCount?: number;
  retryDelay?: number;
}

export function useOptimizedData<T>(
  fetchFunction: () => Promise<T>,
  deps: any[] = [],
  options: UseOptimizedDataOptions = {}
) {
  const { ttl = 5 * 60 * 1000, retryCount = 3, retryDelay = 1000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback(() => {
    return JSON.stringify(deps);
  }, [deps]);

  const isCacheValid = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  const fetchData = useCallback(async () => {
    const cacheKey = getCacheKey();
    const cachedEntry = cacheRef.current.get(cacheKey);
    
    // Return cached data if valid
    if (cachedEntry && isCacheValid(cachedEntry)) {
      setData(cachedEntry.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    let attempt = 0;
    while (attempt < retryCount) {
      try {
        const result = await fetchFunction();
        
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl
        });
        
        setData(result);
        setError(null);
        break;
      } catch (err: any) {
        attempt++;
        
        if (err.name === 'AbortError') {
          return; // Request was cancelled
        }
        
        if (attempt === retryCount) {
          setError(err.message || 'Failed to fetch data');
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    setLoading(false);
  }, [fetchFunction, deps, ttl, retryCount, retryDelay, getCacheKey, isCacheValid]);

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const refreshData = useCallback(() => {
    invalidateCache();
    fetchData();
  }, [invalidateCache, fetchData]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    invalidateCache
  };
}
