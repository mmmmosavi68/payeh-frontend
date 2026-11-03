"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { key: string; data?: T; failed?: boolean; error?: unknown };

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
      .catch((error: unknown) => {
        if (!cancelled) setState({ key: requestKey, failed: true, error });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  const isCurrentFailure = state.failed === true && state.key === requestKey;

  return {
    data: state.failed ? undefined : state.data,
    failed: isCurrentFailure,
    error: isCurrentFailure ? state.error : undefined,
    loading: state.key !== requestKey,
    reload,
  };
}
