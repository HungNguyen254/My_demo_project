// File: TRAFFIC_SYSTEM_FE/js/main.js
// Trang chủ: dự báo AI (gọi /predictions/forecast thật), trạng thái nav theo đăng nhập.

import { checkHealth, isAdmin, isLoggedIn, request } from "./api.js";

const CONGESTION_MAP = {
  1: { textClass: "text-green",   label: "Thông thoáng" },
  2: { textClass: "text-yellow",  label: "Di chuyển chậm" },
  3: { textClass: "text-red",     label: "Ùn tắc nghiêm trọng" },
  4: { textClass: "text-darkred", label: "Kẹt xe hoàn toàn" }
};

document.addEventListener("DOMContentLoaded", () => {
  updateNav();
  initBackendConnection();
  initForecastForm();
  initHeroStats();
});

/** Hiện "Quản trị" khi là admin, đổi "Đăng nhập" thành "Tài khoản" khi đã đăng nhập. */
function updateNav() {
  const authLink = document.getElementById("nav-auth");
  const adminLink = document.getElementById("nav-admin");
  if (!authLink || !adminLink) return;
  if (isLoggedIn()) {
    authLink.textContent = "Tài khoản";
    adminLink.hidden = !isAdmin();
  }
}

/**
 * 1. Nút kết nối Backend (section #connect)
 */
function initBackendConnection() {
  const fetchBtn = document.getElementById("fetch-btn");
  const output = document.getElementById("output");
  if (!fetchBtn || !output) return;

  fetchBtn.addEventListener("click", async () => {
    output.style.color = "#475569";
    output.textContent = "Đang kết nối tới Backend...";
    try {
      await checkHealth();
      output.style.color = "#16a34a";
      output.textContent = `✅ Backend và database đã kết nối. (${new Date().toLocaleTimeString()})`;
    } catch (err) {
      output.style.color = "#dc2626";
      output.textContent = `❌ Không thể kết nối Backend (${err.message}).`;
    }
  });
}

/**
 * 2. Form dự báo AI -> POST /predictions/forecast
 */
function initForecastForm() {
  const form = document.getElementById("forecast-form");
  if (!form) return;

  const statusEl = document.getElementById("fc-status");
  const resultBox = document.getElementById("fc-result");
  const submitBtn = document.getElementById("fc-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const streetName = document.getElementById("fc-street").value.trim();
    const weather = document.getElementById("fc-weather").value;
    const minutes = Number(document.getElementById("fc-minutes").value);
    if (!streetName) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang dự báo...";
    statusEl.textContent = "Hệ thống AI đang tính toán, vui lòng chờ...";

    try {
      const data = await request("/predictions/forecast", {
        method: "POST",
        body: {
          street_name: streetName,
          weather,
          minutes_ahead: [minutes],
        },
      });
      renderForecast(data);
      statusEl.textContent = `Dự báo thành công cho tuyến "${data.street_name}".`;
    } catch (err) {
      resultBox.hidden = true;
      statusEl.textContent = `❌ ${err.message}`;
      statusEl.style.color = "#dc2626";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Dự báo";
    }
  });
}

function renderForecast(data) {
  const resultBox = document.getElementById("fc-result");
  const titleEl = document.getElementById("fc-street-title");
  const maxSpeedEl = document.getElementById("fc-max-speed");
  const timelineEl = document.getElementById("fc-timeline");
  const statusEl = document.getElementById("fc-status");

  titleEl.textContent = data.street_name;
  maxSpeedEl.textContent = `Giới hạn tốc độ: ${data.max_speed_limit} km/h`;

  timelineEl.innerHTML = (data.timeline || []).map((item) => {
    const lvl = CONGESTION_MAP[item.congestion_level] || CONGESTION_MAP[2];
    const percent = Math.round(item.risk_factor * 100);
    const targetTime = new Date(item.target_time).toLocaleTimeString("vi-VN", {
      hour: "2-digit", minute: "2-digit"
    });
    return `
      <li class="timeline-item">
        <div class="timeline-time">
          <strong>+${item.minutes_ahead} phút</strong>
          <small>${targetTime}</small>
        </div>
        <div class="timeline-body">
          <div class="timeline-speed ${lvl.textClass}">
            ${item.predicted_speed} km/h
            <small>(${lvl.label})</small>
          </div>
          <div class="risk-track" title="Hệ số rủi ro">
            <div class="risk-bar" style="width: ${percent}%;"></div>
          </div>
          <p class="timeline-desc">${item.description}</p>
        </div>
      </li>
    `;
  }).join("");

  statusEl.style.color = "";
  resultBox.hidden = false;
}

/**
 * 3. Thống kê nhanh ở hero: đếm số tuyến/điểm nóng ùn tắc từ dữ liệu tĩnh
 *    (backend chưa có endpoint hotspots, dùng danh sách điểm nóng hiện có).
 */
function initHeroStats() {
  const cards = document.querySelectorAll("#hotspot-grid .hotspot-card");
  if (!cards.length) return;

  let congested = 0;
  let totalSpeed = 0;
  const SPEED_BY_LEVEL = { 1: 45, 2: 22, 3: 11, 4: 4 };

  cards.forEach((card) => {
    const text = card.querySelector(".hotspot-index")?.textContent || "";
    const level = text.includes("hoàn toàn") ? 4
      : text.includes("nghiêm trọng") ? 3
      : text.includes("chậm") ? 2 : 1;
    if (level >= 3) congested++;
    totalSpeed += SPEED_BY_LEVEL[level];
  });

  const edges = document.getElementById("stat-edges");
  const cong = document.getElementById("stat-congested");
  const avg = document.getElementById("stat-avg");
  if (edges) edges.textContent = "59";       // số nút giao trọng điểm đang mock
  if (cong) cong.textContent = String(congested);
  if (avg) avg.textContent = `${Math.round(totalSpeed / cards.length)} km/h`;
}
