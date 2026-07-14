import { useCallback, useEffect, useRef, useState } from 'react';

export default function useFetch(fetcher, deps = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetcher();
      if (mounted.current) {
        setData(result);
      }
    } catch (fetchError) {
      if (mounted.current) {
        setError(fetchError.message || 'Erreur de chargement');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
  }, [refresh, ...deps]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error, refresh };
}
