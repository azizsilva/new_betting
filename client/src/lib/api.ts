import axios from "axios";
import { useAuthStore } from "@/store/auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
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
