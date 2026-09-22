import { useCallback, useEffect, useRef, useState } from "react";

export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [value, setValue] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const latest = useRef(loader);
  latest.current = loader;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    setValue(undefined);
    latest
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setValue(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [...dependencies, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { value, error, loading, reload, setValue };
}
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
