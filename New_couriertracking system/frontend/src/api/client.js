const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const readErrorMessage = (payload) => {
  if (payload?.errors?.length) {
    return payload.errors[0].message;
  }

  return payload?.message || "Request failed.";
};

const request = async (endpoint, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readErrorMessage(payload));
  }

  return payload;
};

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  adminLogin: (payload) => request("/api/auth/admin/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),
  createShipment: (payload, token) =>
    request("/api/shipments", { method: "POST", body: payload, token }),
  myShipments: (token) => request("/api/shipments/mine", { token }),
  trackShipment: (trackingId) =>
    request(`/api/shipments/track/${encodeURIComponent(trackingId)}`),
  adminDashboard: (token) => request("/api/admin/dashboard", { token }),
  adminShipments: (token, queryString = "") =>
    request(`/api/admin/shipments${queryString}`, { token }),
  updateShipmentStatus: (shipmentId, payload, token) =>
    request(`/api/admin/shipments/${shipmentId}/status`, {
      method: "PATCH",
      body: payload,
      token
    }),
  adminUsers: (token) => request("/api/admin/users", { token }),
  updateUser: (userId, payload, token) =>
    request(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: payload,
      token
    })
};
