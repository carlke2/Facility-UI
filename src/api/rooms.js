import { http } from "../lib/http";

export const roomsApi = {
  async list() {
    const { data } = await http.get("/rooms");
    return Array.isArray(data) ? data : data?.rooms || [];
  },

  async create(payload) {
    const { data } = await http.post("/rooms", payload);
    return data;
  },

  async update(id, patch) {
    const { data } = await http.patch(`/rooms/${id}`, patch);
    return data;
  },

  //  delete room
  async remove(id) {
    const { data } = await http.delete(`/rooms/${id}`);
    return data;
  },
};
