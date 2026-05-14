/**
 * UniBot — Smart Chatbot floating bubble module
 * Import and call initChatbot(studentId) from any student page.
 */
import { StudentAPI } from "/js/student-api.js";

let _chatInited = false;
let _studentId = null;
let _messages = [];
let _isOpen = false;
let _isLoading = false;

export function initChatbot(studentId) {
  if (_chatInited) return;
  _chatInited = true;
  _studentId = studentId;
  injectHTML();
  bindEvents();
}

function injectHTML() {
  const wrapper = document.createElement("div");
  wrapper.id = "unibot";
  wrapper.innerHTML = `
    <button id="unibot-fab" aria-label="Open UniBot" title="Ask UniBot">
      <i class="fas fa-robot" id="unibot-fab-icon"></i>
      <span class="unibot-fab-pulse"></span>
    </button>

    <div id="unibot-panel" class="unibot-closed">
      <div class="unibot-header">
        <div class="unibot-header-left">
          <div class="unibot-avatar"><i class="fas fa-robot"></i></div>
          <div>
            <div class="unibot-title">UniBot</div>
            <div class="unibot-subtitle">Smart Academic Assistant</div>
          </div>
        </div>
        <div class="unibot-header-actions">
          <button id="unibot-clear" title="Clear chat"><i class="fas fa-trash-can"></i></button>
          <button id="unibot-close" title="Close"><i class="fas fa-xmark"></i></button>
        </div>
      </div>

      <div id="unibot-messages" class="unibot-messages">
        <div class="unibot-welcome">
          <div class="unibot-welcome-icon"><i class="fas fa-graduation-cap"></i></div>
          <h3>Hi there! I'm UniBot</h3>
          <p>Your smart academic assistant. Ask me about your grades, GPA, schedule, attendance, or any university question!</p>
          <div class="unibot-suggestions">
            <button class="unibot-suggestion" data-q="What is my GPA?">📊 My GPA</button>
            <button class="unibot-suggestion" data-q="Show my grades">📝 Grades</button>
            <button class="unibot-suggestion" data-q="How is my attendance?">📋 Attendance</button>
            <button class="unibot-suggestion" data-q="What is my schedule today?">📅 Schedule</button>
            <button class="unibot-suggestion" data-q="Any warnings or risks?">⚠️ Warnings</button>
            <button class="unibot-suggestion" data-q="Give me study tips">💡 Tips</button>
          </div>
        </div>
      </div>

      <div class="unibot-input-area">
        <div class="unibot-input-wrap">
          <textarea id="unibot-input" placeholder="Ask me anything..." rows="1"></textarea>
          <button id="unibot-send" title="Send" disabled>
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <div class="unibot-powered">UniBot — Your Smart Academic Assistant</div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
}

function bindEvents() {
  const fab = document.getElementById("unibot-fab");
  const closeBtn = document.getElementById("unibot-close");
  const clearBtn = document.getElementById("unibot-clear");
  const input = document.getElementById("unibot-input");
  const sendBtn = document.getElementById("unibot-send");

  fab.addEventListener("click", () => togglePanel());
  closeBtn.addEventListener("click", () => togglePanel(false));
  clearBtn.addEventListener("click", () => clearChat());

  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener("input", () => {
    sendBtn.disabled = !input.value.trim();
    autoResize(input);
  });

  // Bind initial suggestion buttons
  bindSuggestionButtons(document);
}

function bindSuggestionButtons(root) {
  root.querySelectorAll(".unibot-suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      if (_isLoading) return;
      document.getElementById("unibot-input").value = btn.dataset.q;
      document.getElementById("unibot-send").disabled = false;
      sendMessage();
    });
  });
}

function togglePanel(force) {
  const panel = document.getElementById("unibot-panel");
  const fab = document.getElementById("unibot-fab");
  const fabIcon = document.getElementById("unibot-fab-icon");
  _isOpen = force !== undefined ? force : !_isOpen;

  if (_isOpen) {
    panel.classList.remove("unibot-closed");
    panel.classList.add("unibot-open");
    fab.classList.add("unibot-fab-active");
    fabIcon.className = "fas fa-xmark";
    document.getElementById("unibot-input").focus();
  } else {
    panel.classList.remove("unibot-open");
    panel.classList.add("unibot-closed");
    fab.classList.remove("unibot-fab-active");
    fabIcon.className = "fas fa-robot";
  }
}

function clearChat() {
  _messages = [];
  const container = document.getElementById("unibot-messages");
  container.innerHTML = `
    <div class="unibot-welcome">
      <div class="unibot-welcome-icon"><i class="fas fa-graduation-cap"></i></div>
      <h3>Hi there! I'm UniBot</h3>
      <p>Your smart academic assistant. Ask me about your grades, GPA, schedule, attendance, or any university question!</p>
      <div class="unibot-suggestions">
        <button class="unibot-suggestion" data-q="What is my GPA?">📊 My GPA</button>
        <button class="unibot-suggestion" data-q="Show my grades">📝 Grades</button>
        <button class="unibot-suggestion" data-q="How is my attendance?">📋 Attendance</button>
        <button class="unibot-suggestion" data-q="What is my schedule today?">📅 Schedule</button>
        <button class="unibot-suggestion" data-q="Any warnings or risks?">⚠️ Warnings</button>
        <button class="unibot-suggestion" data-q="Give me study tips">💡 Tips</button>
      </div>
    </div>
  `;
  bindSuggestionButtons(container);
}

async function sendMessage(overrideText) {
  const input = document.getElementById("unibot-input");
  const text = overrideText || input.value.trim();
  if (!text || _isLoading) return;

  input.value = "";
  input.style.height = "auto";
  document.getElementById("unibot-send").disabled = true;

  // Remove welcome screen if present
  const welcome = document.querySelector(".unibot-welcome");
  if (welcome) welcome.remove();

  // Remove any previous follow-up buttons
  const oldFollowUps = document.querySelectorAll(".unibot-followups");
  oldFollowUps.forEach(el => el.remove());

  // Add user message
  _messages.push({ role: "user", content: text });
  appendMessage("user", text);

  // Show typing indicator
  _isLoading = true;
  const loadingEl = appendLoading();

  try {
    const data = await StudentAPI.chat(_studentId, _messages);
    const { reply, followUps, lang } = data;

    _messages.push({ role: "model", content: reply });

    // Simulate typing delay based on reply length (1.2s–3s)
    const delay = Math.min(3000, Math.max(1200, reply.length * 4));
    await sleep(delay);

    loadingEl.remove();
    appendMessage("model", reply, false, lang);

    // Add follow-up choice buttons
    if (followUps && followUps.length) {
      appendFollowUps(followUps, lang);
    }
  } catch (err) {
    loadingEl.remove();
    _messages.pop();
    appendMessage("model", "Sorry, something went wrong. Please try again.", true);
  } finally {
    _isLoading = false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function appendMessage(role, content, isError = false, lang = "en") {
  const container = document.getElementById("unibot-messages");
  const div = document.createElement("div");
  div.className = `unibot-msg unibot-msg-${role}${isError ? " unibot-msg-error" : ""}`;
  if (lang === "ar") div.setAttribute("dir", "rtl");

  if (role === "model") {
    div.innerHTML = `
      <div class="unibot-msg-avatar"><i class="fas fa-robot"></i></div>
      <div class="unibot-msg-bubble">${formatMarkdown(content)}</div>
    `;
  } else {
    div.innerHTML = `<div class="unibot-msg-bubble">${escapeHtml(content)}</div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendFollowUps(followUps, lang) {
  const container = document.getElementById("unibot-messages");
  const div = document.createElement("div");
  div.className = "unibot-followups";
  if (lang === "ar") div.setAttribute("dir", "rtl");

  const label = lang === "ar" ? "ممكن أساعدك في حاجة تانية؟" : "Anything else I can help with?";
  div.innerHTML = `
    <div class="unibot-followups-label">${label}</div>
    <div class="unibot-followups-btns">
      ${followUps.map(f => `<button class="unibot-suggestion" data-q="${escapeAttr(f)}">${f}</button>`).join("")}
    </div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Bind click handlers on new buttons
  div.querySelectorAll(".unibot-suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      if (_isLoading) return;
      sendMessage(btn.dataset.q);
    });
  });
}

function appendLoading() {
  const container = document.getElementById("unibot-messages");
  const div = document.createElement("div");
  div.className = "unibot-msg unibot-msg-model unibot-loading";
  div.innerHTML = `
    <div class="unibot-msg-avatar"><i class="fas fa-robot"></i></div>
    <div class="unibot-msg-bubble">
      <div class="unibot-typing">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n/g, '<br>');
  return html;
}
