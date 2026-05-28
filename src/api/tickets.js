import { http } from "../lib/http";

export const ticketsApi = {
  async create(payload) {
    const { data } = await http.post("/tickets", payload);
    return data;
  },

  async list(filters = {}) {
    const { data } = await http.get("/tickets", { params: filters });
    return data;
  },

  async findOne(id) {
    const { data } = await http.get(`/tickets/${id}`);
    return data;
  },

  async getContext(id) {
    const { data } = await http.get(`/tickets/${id}/context`);
    return data;
  },

  async getComments(id, includeInternal = false) {
    const { data } = await http.get(`/tickets/${id}/comments`, {
      params: { includeInternal },
    });
    return data;
  },

  async addComment(id, payload) {
    const { data } = await http.post(`/tickets/${id}/comments`, payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.patch(`/tickets/${id}`, payload);
    return data;
  },

  async assign(id, assignedToId) {
    const { data } = await http.patch(`/tickets/${id}/assign`, { assignedToId });
    return data;
  },

  async escalate(id, reason) {
    const { data } = await http.patch(`/tickets/${id}/escalate`, { reason });
    return data;
  },

  async resolve(id, resolutionNote) {
    const { data } = await http.patch(`/tickets/${id}/resolve`, { resolutionNote });
    return data;
  },

  async close(id) {
    const { data } = await http.patch(`/tickets/${id}/close`);
    return data;
  },
};
