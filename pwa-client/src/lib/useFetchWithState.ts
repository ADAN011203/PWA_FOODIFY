import { useEffect, useState } from "react";
import { api, publicApi } from "./api";

/**
 * Generic hook that fetches data.
 * Uses `publicApi` for public routes (/menu) and `api` for protected routes (which auto-appends /api/v1 and tokens).
 */
export function useFetchWithState<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = url.startsWith("/menu") ? publicApi : api;
      const res = await client.get(url);
      
      // Expected backend shape is usually { data: ... }
      const payload = res.data?.data ?? res.data;
      
      if (Array.isArray(payload) && payload.length === 0) {
        setEmpty(true);
        setData(null);
      } else {
        setData(payload);
        setEmpty(false);
      }
    } catch (e: any) {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, setData, loading, error, empty, refetch: fetchData };
}
