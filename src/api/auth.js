import { http } from "../lib/http";

function normalizeAuthResponse(res) {
  const data = res?.data;

  const tokenFromBody =
    data?.token ||
    data?.jwt ||
    data?.accessToken ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token;

  const h = res?.headers || {};
  const tokenFromHeader =
    h["authorization"] ||
    h["Authorization"] ||
    h["x-auth-token"] ||
    h["X-Auth-Token"];

  const cleanedHeaderToken =
    typeof tokenFromHeader === "string" &&
    tokenFromHeader.toLowerCase().startsWith("bearer ")
      ? tokenFromHeader.slice(7)
      : tokenFromHeader;

  return {
    raw: data,
    token: tokenFromBody || cleanedHeaderToken || null,
    user:
      data?.user ||
      data?.me ||
      data?.data?.user ||
      data?.data?.me ||
      null,
  };
}

export const authApi = {
   async register(payload) {
    const res = await http.post("/auth/register", payload);
    return normalizeAuthResponse(res);
  },

  async login(payload) {
    const res = await http.post("/auth/login", payload);
    return normalizeAuthResponse(res);
  },

  async me() {
    const { data } = await http.get("/auth/me");
    return data;
  },

  async verifyOtp(payload) {
    const res = await http.post("/auth/verify-otp", payload);
    return normalizeAuthResponse(res);
  },

  async googleLogin(payload) {
    const res = await http.post("/auth/google", payload);
    return normalizeAuthResponse(res);
  },



  // request reset link
  async forgotPassword(email) {
    const { data } = await http.post("/auth/forgot-password", { email });
    return data;
  },

  // submit new password
  async resetPassword(token, newPassword) {
    const { data } = await http.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return data;
  },
};
