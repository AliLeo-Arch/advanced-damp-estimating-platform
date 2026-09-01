import { useCallback, useEffect, useRef, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useAsyncLoad<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await loaderRef.current();
      setData(result);
      setStatus("success");
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while loading.";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const result = await loaderRef.current();
        if (!cancelled) {
          setData(result);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Something went wrong while loading.";
          setError(message);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, deps);

  return {
    data,
    status,
    loading: status === "loading" || status === "idle",
    error,
    reload,
    setData,
  };
}
