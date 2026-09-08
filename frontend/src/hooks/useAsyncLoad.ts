import { useCallback, useEffect, useRef, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useDelayedFlag(active: boolean, delayMs = 160) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return visible;
}

export function useLoadMode(initiallyLoading = true) {
  const generationRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const [loading, setLoading] = useState(initiallyLoading);
  const [refreshing, setRefreshing] = useState(false);

  const begin = useCallback(() => {
    const generation = ++generationRef.current;
    if (hasLoadedRef.current) setRefreshing(true);
    else setLoading(true);
    return generation;
  }, []);

  const end = useCallback((generation?: number) => {
    if (generation != null && generation !== generationRef.current) return;
    hasLoadedRef.current = true;
    setLoading(false);
    setRefreshing(false);
  }, []);

  return { loading, refreshing, begin, end };
}

export function useAsyncLoad<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  const generationRef = useRef(0);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const generation = ++generationRef.current;
    setStatus("loading");
    setError(null);
    try {
      const result = await loaderRef.current();
      if (generation !== generationRef.current) return result;
      setData(result);
      setStatus("success");
      return result;
    } catch (err) {
      if (generation !== generationRef.current) return undefined as T;
      const message =
        err instanceof Error ? err.message : "Something went wrong while loading.";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    setStatus("loading");
    setError(null);
    void loaderRef
      .current()
      .then((result) => {
        if (generation !== generationRef.current) return;
        setData(result);
        setStatus("success");
      })
      .catch((err) => {
        if (generation !== generationRef.current) return;
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while loading.";
        setError(message);
        setStatus("error");
      });
    return () => {
      generationRef.current += 1;
    };
  }, deps);

  const loading = status === "loading" && data == null;
  const refreshing = status === "loading" && data != null;

  return {
    data,
    status,
    loading,
    refreshing,
    error,
    reload,
    setData,
  };
}
