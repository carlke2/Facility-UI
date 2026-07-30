import { http } from "../lib/http";

export const dayApi = {
  async getDay(date) {
    const { data } = await http.get(`/bookings/day?date=${encodeURIComponent(date)}`);
    return data;
  },
};
