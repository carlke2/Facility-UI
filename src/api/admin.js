import { http } from "../lib/http";

export const adminApi = {
  async activity({ limit = 50, skip = 0 } = {}) {
    try {
      const page = Math.floor(skip / limit) + 1;
      const { data } = await http.get("/activity", {
        params: { limit, page },
      });
      return {
        ok: true,
        items: data?.data || [],
        total: data?.total || 0,
      };
    } catch (err) {
      return {
        ok: false,
        message: err?.response?.data?.message || "Failed to fetch activity logs",
      };
    }
  },
};
