import { useEffect, useState } from "react";
import { api, publicApi } from "./api";

/**
 * Generic hook that fetches data.
 * Uses `publicApi` for public routes (/menu) and `api` for protected routes (which auto-appends /api/v1 and tokens).
 */
export function useFetchWithState<T>(
  url: string,
  fetcher?: () => Promise<T>,
  refreshInterval: number = 0 // en ms (ej. 15000)
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    console.log(`[Fetch] Starting: ${url || "fetcher"}`);
    try {
      let payload: any;
      if (fetcher) {
        payload = await fetcher();
      } else {
        const client = url.startsWith("/menu") ? publicApi : api;
        const res = await client.get(url);
        payload = res.data?.data ?? res.data;
      }
      
      if (Array.isArray(payload)) {
        const cleanData = payload.filter(Boolean);
        if (cleanData.length === 0) {
          setEmpty(true);
          setData(null);
        } else {
          setData(cleanData as T);
          setEmpty(false);
        }
      } else {
        setData(payload);
        setEmpty(false);
      }
    } catch (e: any) {
      // ... error handling ...
      let errMsg = "Error de conexión";
      const apiMsg = e.response?.data?.message;
      if (typeof apiMsg === "string") {
        errMsg = apiMsg;
      } else if (apiMsg && typeof apiMsg === "object") {
        errMsg = apiMsg.message || apiMsg.error || JSON.stringify(apiMsg);
        if (Array.isArray(errMsg)) errMsg = errMsg[0];
      } else if (e.message) {
        errMsg = e.message;
      }
      setError(String(errMsg));
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchData(true);
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, fetcher, refreshInterval]);

  return { data, setData, loading, error, empty, refetch: () => fetchData(false) };
}
