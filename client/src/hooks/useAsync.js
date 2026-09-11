import { useEffect, useRef, useState } from 'react';

export function useAsync(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refetch = () => {
    const id = requestIdRef.current + 1;
    requestIdRef.current = id;
    if (!enabledRef.current) return;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (requestIdRef.current === id) setData(result);
      })
      .catch((err) => {
        if (requestIdRef.current === id) setError(err);
      })
      .finally(() => {
        if (requestIdRef.current === id) setLoading(false);
      });
  };

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: () => refetchRef.current() };
}