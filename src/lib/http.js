import axios from "axios";
import { storage } from "./storage";
import { API_BASE_URL } from "../config";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request (from storage)
http.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config?.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

// Global 401 handling
http.interceptors.response.use(
  (res) => {
    // Recursively map `id` fields to `_id` to prevent UI card rendering crashes
    const mapId = (obj) => {
      if (!obj || typeof obj !== "object") return;
      if (obj.id && !obj._id) obj._id = obj.id;
      Object.values(obj).forEach(val => {
        if (Array.isArray(val)) val.forEach(mapId);
        else if (typeof val === "object") mapId(val);
      });
    };
    mapId(res.data);
    return res;
  },
  (err) => {
    const status = err?.response?.status;

    // If token expired / invalid — log out on frontend
    if (status === 401) {
      storage.clear();

      // Avoid hard reload loops; send user to login only if they are in the protected app area
      if (typeof window !== "undefined") {
        const path = window.location.pathname || "";
        if (path.startsWith("/app")) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(err);
  }
);
