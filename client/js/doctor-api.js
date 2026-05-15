// ============================================================
// doctor-api.js — API client for the Doctor dashboard
// ============================================================

const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("uv_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const Auth = {
  getSession: () => {
    try {
      const token = localStorage.getItem("uv_token");
      if (!token) return {};
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { id: payload.id, role: payload.role, name: payload.name, token };
    } catch { return {}; }
  },
  requireAuth: () => {
    const token = localStorage.getItem("uv_token");
    if (!token) { window.location.href = "/"; throw new Error("Not authenticated"); }
  },
  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    localStorage.clear();
    document.cookie = "uv_role=; Max-Age=0; path=/";
    window.location.href = "/";
  },
};

export const DoctorAPI = {
  getStudents:      ()         => apiFetch("/doctor/students"),
  getStudent:       (id)       => apiFetch(`/doctor/student/${id}`),

  getSemesters:     (id)       => apiFetch(`/doctor/student/${id}/semesters`),
  getGrades:        (id)       => apiFetch(`/doctor/student/${id}/grades`),
  saveGrade:        (id, data) => apiFetch(`/doctor/student/${id}/grades`,    { method: "POST",   body: JSON.stringify(data) }),
  deleteGrade:      (gid)      => apiFetch(`/doctor/grade/${gid}`,            { method: "DELETE" }),

  getAttendance:    (id)       => apiFetch(`/doctor/student/${id}/attendance`),
  saveAttendance:   (id, data) => apiFetch(`/doctor/student/${id}/attendance`,{ method: "POST",   body: JSON.stringify(data) }),
  deleteAttendance: (aid)      => apiFetch(`/doctor/attendance/${aid}`,       { method: "DELETE" }),

  getFeedback:      (id)       => apiFetch(`/doctor/student/${id}/feedback`),
  addFeedback:      (id, data) => apiFetch(`/doctor/student/${id}/feedback`,  { method: "POST",   body: JSON.stringify(data) }),
  updateFeedback:   (fid, data) => apiFetch(`/doctor/feedback/${fid}`,        { method: "PUT",    body: JSON.stringify(data) }),

  addStudent: (data) => apiFetch("/admin/students", { method: "POST", body: JSON.stringify(data) }),
  deleteFeedback:   (fid)      => apiFetch(`/doctor/feedback/${fid}`,         { method: "DELETE" }),

  getSchedule:    (semester)   => apiFetch(`/doctor/schedule/${semester}`),
  addSchedule:    (semester, data) => apiFetch(`/doctor/schedule/${semester}`, { method: "POST",   body: JSON.stringify(data) }),
  updateSchedule: (scid, data) => apiFetch(`/doctor/schedule-entry/${scid}`,  { method: "PUT",    body: JSON.stringify(data) }),
  deleteSchedule: (scid)      => apiFetch(`/doctor/schedule-entry/${scid}`,   { method: "DELETE" }),

  // Admin Feedback (admin → doctor, per student context)
  getAdminFeedback:    (sid)       => apiFetch(`/doctor/student/${sid}/admin-feedback`),
  sendAdminFeedback:   (sid, data) => apiFetch(`/doctor/student/${sid}/admin-feedback`, { method: "POST", body: JSON.stringify(data) }),
  updateAdminFeedback: (id, data)  => apiFetch(`/doctor/admin-feedback/${id}`,          { method: "PUT",  body: JSON.stringify(data) }),
  deleteAdminFeedback: (id)        => apiFetch(`/doctor/admin-feedback/${id}`,           { method: "DELETE" }),

  // Course Materials
  getMaterials:       ()           => apiFetch("/doctor/materials"),
  addMaterial:        (data)       => apiFetch("/doctor/materials", { method: "POST", body: JSON.stringify(data) }),
  deleteMaterial:     (id)         => apiFetch(`/doctor/material/${id}`, { method: "DELETE" }),

  // Notifications (admin only)
  getNotifications:    ()          => apiFetch("/admin/notifications"),
  createNotification:  (data)      => apiFetch("/admin/notifications", { method: "POST", body: JSON.stringify(data) }),
  deleteNotification:  (id)        => apiFetch(`/admin/notifications/${id}`, { method: "DELETE" }),
};
