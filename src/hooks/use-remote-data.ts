"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { key: string; data?: T; failed?: boolean };

/**
 * Loads data whenever `key` changes. `loading` is derived, so the previous
 * data stays on screen while the next request is in flight.
 */
export function useRemoteData<T>(key: string, fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "" });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestKey = `${key}#${version}`;

  useEffect(() => {
    let cancelled = false;

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ key: requestKey, data });
      })
      .catch(() => {
        if (!cancelled) setState({ key: requestKey, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return {
    data: state.failed ? undefined : state.data,
    failed: state.failed === true && state.key === requestKey,
    loading: state.key !== requestKey,
    reload,
  };
}