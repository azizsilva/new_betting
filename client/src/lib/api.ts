import axios from "axios";
import { useAuthStore } from "@/store/auth";

// In production the Next.js app is served behind an Nginx reverse proxy that
// forwards /api/* → localhost:4000. Using a relative base means the browser
// never tries to reach localhost:4000 directly (which breaks when the client
// is loaded from a remote IP). Falls back to localhost only in local dev.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api"
    : "http://localhost:4000/api");

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach the access token from the auth store on every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a one-shot refresh, then retry; otherwise log out.
let refreshing: Promise<string | null> | null = null;

import { toast } from "sonner";

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    
    // Check if the session was overridden by another device login
    if (error.response?.status === 401 && error.response?.data?.error?.message === "SESSION_OVERRIDDEN") {
      const { logout } = useAuthStore.getState();
      logout();
      toast.error("Quelqu'un a ouvert ce compte sur un autre appareil.", { duration: 5000 });
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }
      refreshing ??= api
        .post("/auth/refresh", { refreshToken })
        .then((r) => {
          setTokens(r.data.accessToken, r.data.refreshToken);
          return r.data.accessToken as string;
        })
        .catch(() => {
          logout();
          return null;
        })
        .finally(() => {
          refreshing = null;
        });

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
