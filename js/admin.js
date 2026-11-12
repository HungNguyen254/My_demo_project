// File: TRAFFIC_SYSTEM_FE/js/admin.js
// Trang quản trị: huấn luyện lại mô hình AI (POST /admin/retrain-model).

import { clearSession, getToken, getUser, isAdmin, request } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // Chưa đăng nhập hoặc không phải admin -> chặn luôn
  if (!getToken() || !isAdmin()) {
    document.querySelector(".admin-main .section").innerHTML = `
      <div class="card admin-card">
        <h2>⛔ Không có quyền truy cập</h2>
        <p>Trang này chỉ dành cho quản trị viên. Hãy <a href="login.html">đăng nhập</a> bằng tài khoản admin.</p>
      </div>
    `;
    return;
  }

  updateSessionStatus();
  initRetrain();
});

function updateSessionStatus() {
  const user = getUser();
  document.getElementById("st-logged").textContent = user ? "Có" : "Không";
  document.getElementById("st-email").textContent = user?.user_id || "--";
  document.getElementById("st-role").textContent =
    user?.role === "admin" ? "Quản trị viên" : user?.role || "--";
}

function initRetrain() {
  const btn = document.getElementById("retrain-btn");
  const message = document.getElementById("retrain-message");
  if (!btn || !message) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Đang gửi yêu cầu...";
    message.textContent = "";
    message.style.color = "";

    try {
      const data = await request("/admin/retrain-model", {
        method: "POST",
        auth: true,
      });
      message.style.color = "#16a34a";
      message.textContent = `✅ ${data.message || "Backend đã tiếp nhận yêu cầu huấn luyện trong tiến trình ngầm."}`;
    } catch (err) {
      message.style.color = "#dc2626";
      message.textContent = `❌ ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Huấn luyện lại mô hình";
    }
  });
}

document.getElementById("logout-btn")?.addEventListener("click", () => {
  clearSession();
  window.location.replace("main.html");
});
