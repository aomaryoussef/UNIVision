/**
 * theme.js — Theme color switcher for UniVision
 * Include via <script src="/js/theme.js"></script> (non-module, runs immediately)
 */
(function () {
  const THEMES = {
    "navy-gold": {
      label: "Navy Gold",
      icon: "fa-sun",
      vars: {} // default — no overrides needed
    },
    "ocean-blue": {
      label: "Ocean Blue",
      icon: "fa-water",
      vars: {
        "--primary-bg":   "#0a1628",
        "--card-bg":      "#101e36",
        "--accent":       "#38bdf8",
        "--accent-light": "#7dd3fc",
        "--accent-rgb":   "56,189,248",
        "--text-primary": "#f0f4f8",
        "--text-secondary":"#94a3b8",
        "--text-muted":   "#64748b",
      }
    },
    "emerald": {
      label: "Emerald",
      icon: "fa-leaf",
      vars: {
        "--primary-bg":   "#071a12",
        "--card-bg":      "#0d2818",
        "--accent":       "#34d399",
        "--accent-light": "#6ee7b7",
        "--accent-rgb":   "52,211,153",
        "--text-primary": "#ecfdf5",
        "--text-secondary":"#a7f3d0",
        "--text-muted":   "#4ade80",
      }
    },
    "royal-purple": {
      label: "Royal Purple",
      icon: "fa-crown",
      vars: {
        "--primary-bg":   "#110a28",
        "--card-bg":      "#1a1040",
        "--accent":       "#a78bfa",
        "--accent-light": "#c4b5fd",
        "--accent-rgb":   "167,139,250",
        "--text-primary": "#f5f3ff",
        "--text-secondary":"#c4b5fd",
        "--text-muted":   "#7c3aed",
      }
    },
    "rose": {
      label: "Rose",
      icon: "fa-heart",
      vars: {
        "--primary-bg":   "#1a0a14",
        "--card-bg":      "#2a1020",
        "--accent":       "#fb7185",
        "--accent-light": "#fda4af",
        "--accent-rgb":   "251,113,133",
        "--text-primary": "#fff1f2",
        "--text-secondary":"#fecdd3",
        "--text-muted":   "#f43f5e",
      }
    },
    "light-white": {
      label: "White",
      icon: "fa-sun",
      light: true,
      vars: {
        "--primary-bg":   "#ffffff",
        "--card-bg":      "#ffffff",
        "--accent":       "#1a56db",
        "--accent-light": "#3b82f6",
        "--accent-rgb":   "26,86,219",
        "--text-primary": "#111827",
        "--text-secondary":"#4b5563",
        "--text-muted":   "#9ca3af",
        "--border":       "rgba(0,0,0,0.08)",
        "--shadow":       "0 4px 24px rgba(0,0,0,0.08)",
        "--danger":       "#dc2626",
        "--success":      "#059669",
        "--warning":      "#d97706",
        "--info":         "#2563eb",
      }
    },
    "light-offwhite": {
      label: "Off-White",
      icon: "fa-cloud",
      light: true,
      vars: {
        "--primary-bg":   "#f8f6f1",
        "--card-bg":      "#ffffff",
        "--accent":       "#b8860b",
        "--accent-light": "#d4a830",
        "--accent-rgb":   "184,134,11",
        "--text-primary": "#1c1917",
        "--text-secondary":"#57534e",
        "--text-muted":   "#a8a29e",
        "--border":       "rgba(0,0,0,0.07)",
        "--shadow":       "0 4px 24px rgba(0,0,0,0.06)",
        "--danger":       "#dc2626",
        "--success":      "#059669",
        "--warning":      "#d97706",
        "--info":         "#2563eb",
      }
    },
    "light-grey": {
      label: "White Grey",
      icon: "fa-cloud-sun",
      light: true,
      vars: {
        "--primary-bg":   "#f1f5f9",
        "--card-bg":      "#ffffff",
        "--accent":       "#475569",
        "--accent-light": "#64748b",
        "--accent-rgb":   "71,85,105",
        "--text-primary": "#0f172a",
        "--text-secondary":"#475569",
        "--text-muted":   "#94a3b8",
        "--border":       "rgba(0,0,0,0.06)",
        "--shadow":       "0 4px 24px rgba(0,0,0,0.06)",
        "--danger":       "#dc2626",
        "--success":      "#059669",
        "--warning":      "#d97706",
        "--info":         "#2563eb",
      }
    },
  };

  const STORAGE_KEY = "uv_theme";

  function applyTheme(id) {
    const theme = THEMES[id];
    if (!theme) return;

    // Reset to defaults first (remove overrides)
    const root = document.documentElement;
    for (const key of Object.keys(THEMES)) {
      for (const v of Object.keys(THEMES[key].vars)) {
        root.style.removeProperty(v);
      }
    }

    // Apply new overrides
    for (const [prop, val] of Object.entries(theme.vars)) {
      root.style.setProperty(prop, val);
    }

    // Toggle light-theme class for CSS overrides
    root.classList.toggle("light-theme", !!theme.light);

    // Update active indicator in dropdown
    document.querySelectorAll(".theme-option").forEach(el => {
      el.classList.toggle("active", el.dataset.theme === id);
    });

    localStorage.setItem(STORAGE_KEY, id);
  }

  function createDropdown() {
    const wrapper = document.createElement("div");
    wrapper.className = "theme-switcher";
    wrapper.innerHTML = `
      <button class="theme-toggle" title="Change Theme">
        <i class="fas fa-palette"></i>
      </button>
      <div class="theme-dropdown">
        <div class="theme-dropdown-title">Theme</div>
        ${Object.entries(THEMES).map(([id, t]) => `
          <div class="theme-option" data-theme="${id}">
            <span class="theme-swatch" style="background:${t.vars["--accent"] || "#d4a830"};"></span>
            <span class="theme-name">${t.label}</span>
            <i class="fas fa-check theme-check"></i>
          </div>
        `).join("")}
      </div>
    `;

    // Toggle dropdown
    const btn = wrapper.querySelector(".theme-toggle");
    const dropdown = wrapper.querySelector(".theme-dropdown");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
    });

    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      const option = e.target.closest(".theme-option");
      if (option) {
        applyTheme(option.dataset.theme);
        dropdown.classList.remove("open");
      }
    });

    return wrapper;
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .theme-switcher {
        position: relative;
        margin-right: 8px;
      }
      .theme-toggle {
        display: flex; align-items: center; justify-content: center;
        width: 38px; height: 38px; border-radius: var(--radius-sm);
        background: rgba(255,255,255,.04); border: 1px solid var(--border);
        color: var(--text-muted); font-size: 1rem;
        cursor: pointer; transition: all .2s;
      }
      .theme-toggle:hover {
        background: rgba(255,255,255,.08); color: var(--accent);
        border-color: var(--accent);
      }
      .theme-dropdown {
        position: absolute; top: calc(100% + 8px); right: 0;
        background: var(--card-bg); border: 1px solid var(--border);
        border-radius: var(--radius); padding: 8px;
        min-width: 180px; box-shadow: var(--shadow);
        opacity: 0; visibility: hidden; transform: translateY(-8px);
        transition: all .2s ease; z-index: 200;
      }
      .theme-dropdown.open {
        opacity: 1; visibility: visible; transform: translateY(0);
      }
      .theme-dropdown-title {
        font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: .8px; color: var(--text-muted);
        padding: 6px 10px 8px; border-bottom: 1px solid var(--border);
        margin-bottom: 4px;
      }
      .theme-option {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 10px; border-radius: var(--radius-sm);
        cursor: pointer; transition: background .15s;
      }
      .theme-option:hover {
        background: rgba(var(--accent-rgb),.08);
      }
      .theme-option.active {
        background: rgba(var(--accent-rgb),.1);
      }
      .theme-swatch {
        width: 16px; height: 16px; border-radius: 50%;
        flex-shrink: 0; border: 2px solid rgba(128,128,128,.2);
      }
      .theme-name {
        font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
        flex: 1;
      }
      .theme-check {
        font-size: 0.7rem; color: var(--accent);
        opacity: 0; transition: opacity .15s;
      }
      .theme-option.active .theme-check {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();

    // Apply saved theme before render
    const saved = localStorage.getItem(STORAGE_KEY) || "navy-gold";
    applyTheme(saved);

    // Wait for DOM, then inject dropdown into navbar
    const tryInject = () => {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;

      const logoutBtn = document.getElementById("logoutBtn");
      const dropdown = createDropdown();

      if (logoutBtn) {
        navbar.insertBefore(dropdown, logoutBtn);
      } else {
        navbar.appendChild(dropdown);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryInject);
    } else {
      tryInject();
    }
  }

  // Apply theme immediately (before DOM) to prevent flash
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES[saved]) {
    const root = document.documentElement;
    for (const [prop, val] of Object.entries(THEMES[saved].vars)) {
      root.style.setProperty(prop, val);
    }
    if (THEMES[saved].light) root.classList.add("light-theme");
  }

  init();
})();
