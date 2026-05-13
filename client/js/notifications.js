// notifications.js — Student notification bell logic
// Usage: import { initNotifications } from "/js/notifications.js";
//        initNotifications(studentId);

import { StudentAPI } from "/js/student-api.js";

const NOTIF_ICONS = {
  day_off: "fa-calendar-xmark",
  lecture_cancelled: "fa-ban",
  event: "fa-calendar-star",
  holiday: "fa-umbrella-beach",
  exam: "fa-file-pen",
  general: "fa-bullhorn",
};

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr + "Z").toLocaleDateString();
}

function getDateLabel(dateStr) {
  const now = new Date();
  const date = new Date(dateStr + "Z");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today - notifDay) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function renderDropdown(notifications, studentId) {
  const dropdown = document.getElementById("notifDropdown");
  if (!notifications.length) {
    dropdown.innerHTML = `
      <div class="notif-dropdown-header"><span>Notifications</span></div>
      <div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>`;
    return;
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  // Group by date
  const groups = [];
  let currentLabel = null;
  for (const n of notifications) {
    const label = getDateLabel(n.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [] });
    }
    groups[groups.length - 1].items.push(n);
  }

  let html = `<div class="notif-dropdown-header">
    <span>Notifications</span>
    ${hasUnread ? `<button id="markAllRead">Mark all read</button>` : ""}
  </div>`;

  for (const group of groups) {
    html += `<div class="notif-date-label">${group.label}</div>`;
    for (const n of group.items) {
      const icon = NOTIF_ICONS[n.category] || "fa-bullhorn";
      html += `
        <div class="notif-item ${n.is_read ? "" : "unread"}" data-id="${n.id}">
          <div class="notif-item-icon ${n.category}"><i class="fas ${icon}"></i></div>
          <div class="notif-item-body">
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-text">${n.body}</div>
            <div class="notif-item-time">${timeAgo(n.created_at)}</div>
          </div>
        </div>`;
    }
  }

  dropdown.innerHTML = html;

  // Mark individual as read on click
  dropdown.querySelectorAll(".notif-item.unread").forEach((el) => {
    el.addEventListener("click", async () => {
      const nid = el.dataset.id;
      await StudentAPI.markNotifRead(studentId, nid);
      el.classList.remove("unread");
      updateBadge();
    });
  });

  // Mark all read
  const markAllBtn = document.getElementById("markAllRead");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      await StudentAPI.markAllNotifsRead(studentId);
      dropdown
        .querySelectorAll(".notif-item.unread")
        .forEach((el) => el.classList.remove("unread"));
      updateBadge();
      markAllBtn.remove();
    });
  }
}

function updateBadge() {
  const badge = document.getElementById("notifCount");
  const unread = document.querySelectorAll(".notif-item.unread").length;
  if (unread > 0) {
    badge.textContent = unread > 9 ? "9+" : unread;
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}

export async function initNotifications(studentId) {
  const bell = document.getElementById("notifBell");
  const dropdown = document.getElementById("notifDropdown");
  if (!bell || !dropdown) return;

  // Toggle dropdown
  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  // Fetch and render
  try {
    const data = await StudentAPI.notifications(studentId);
    renderDropdown(data.notifications, studentId);
    const badge = document.getElementById("notifCount");
    if (data.unread > 0) {
      badge.textContent = data.unread > 9 ? "9+" : data.unread;
      badge.style.display = "";
    }
  } catch (e) {
    console.error("Failed to load notifications:", e);
  }
}
