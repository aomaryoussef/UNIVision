const API_BASE = "/api";

function getSession() {
  try {
    const token = localStorage.getItem("uv_token");
    if (!token) return {};
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.id, role: payload.role, name: payload.name, token };
  } catch { return {}; }
}

async function apiFetch(path, opts = {}) {
  const { token } = getSession();
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const Auth = {
  getSession,

  login: async (role, id, password) => {
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, id, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Login failed" };
      localStorage.setItem("uv_token", data.token);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: "Network error" };
    }
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    localStorage.removeItem("uv_token");
    localStorage.clear(); // clear any keys the old api.js may have used
    document.cookie = "uv_role=; Max-Age=0; path=/";
    window.location.href = "/";
  },
};

export const StudentAPI = {
  home:       (sid) => apiFetch(`/student/${sid}/home`),
  profile:    (sid) => apiFetch(`/student/${sid}/profile`),
  grades:     (sid) => apiFetch(`/student/${sid}/grades`),
  attendance: (sid) => apiFetch(`/student/${sid}/attendance`),
  reports:    (sid) => apiFetch(`/student/${sid}/reports`),
  report:     (sid, sem) => apiFetch(`/student/${sid}/reports/${sem}`),
  schedule:   (sid) => apiFetch(`/student/${sid}/schedule`),
  comparison: (sid) => apiFetch(`/student/${sid}/comparison`),

  // Notifications
  notifications:    (sid) => apiFetch(`/student/${sid}/notifications`),
  markNotifRead:    (sid, nid) => apiFetch(`/student/${sid}/notifications/${nid}/read`, { method: "POST" }),
  markAllNotifsRead:(sid) => apiFetch(`/student/${sid}/notifications/read-all`, { method: "POST" }),

  // AI Chatbot
  chat: (sid, messages) => apiFetch(`/student/${sid}/chat`, {
    method: "POST",
    body: JSON.stringify({ messages }),
  }),

  // CV Builder
  getCV:  (sid) => apiFetch(`/student/${sid}/cv`),
  saveCV: (sid, data) => apiFetch(`/student/${sid}/cv`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),

  // Exams
  exams: (sid) => apiFetch(`/student/${sid}/exams`),

  // Course Materials
  materials: (sid) => apiFetch(`/student/${sid}/materials`),

  // Activity Log
  activity:   (sid) => apiFetch(`/student/${sid}/activity`),
  logActivity:(sid, action, detail, page) => apiFetch(`/student/${sid}/activity`, {
    method: "POST",
    body: JSON.stringify({ action, detail, page }),
  }),

  // GPA Simulator (uses existing grades data)
  // No separate endpoint needed — uses grades() data
};
