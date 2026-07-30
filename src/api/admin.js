import { storage } from "../lib/storage";

// In production set: VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com
// In local dev you can leave it empty and rely on Vite proxy for /api
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

const BASE = "/admin";

async function request(path) {
  const token = storage.getToken();

  const res = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: "Server returned non-JSON response.",
      status: res.status,
      raw: text.slice(0, 300),
    };
  }
}

export const adminApi = {
  activity({ limit = 50, skip = 0 } = {}) {
    return request(`${BASE}/activity?limit=${limit}&skip=${skip}`);
  },
};
