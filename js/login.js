// File: TRAFFIC_SYSTEM_FE/js/login.js
// Đăng nhập / Đăng ký / Xem thông tin tài khoản - gọi /auth/* trên Backend.

import {
  clearSession,
  getToken,
  isLoggedIn,
  isAdmin,
  request,
  saveSession,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const mePanel = document.getElementById("me-panel");

  // Đã đăng nhập -> hiện panel "tài khoản của tôi"
  if (isLoggedIn()) {
    loginForm.hidden = true;
    registerForm.hidden = true;
    tabLogin.parentElement.hidden = true;
    mePanel.hidden = false;
    loadMe();
    return;
  }

  // ---- Chuyển tab ----
  tabLogin.addEventListener("click", () => switchTab(true));
  tabRegister.addEventListener("click", () => switchTab(false));

  function switchTab(showLogin) {
    tabLogin.classList.toggle("active", showLogin);
    tabRegister.classList.toggle("active", !showLogin);
    loginForm.hidden = !showLogin;
    registerForm.hidden = showLogin;
  }

  // ---- Đăng nhập ----
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("login-message");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    message.textContent = "Đang xử lý...";
    message.style.color = "";

    try {
      const tokenRes = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      saveSession(tokenRes.access_token, {
        user_id: tokenRes.user_id,
        role: tokenRes.role,
      });
      message.style.color = "#16a34a";
      message.textContent = "✅ Đăng nhập thành công, đang chuyển hướng...";
      setTimeout(() => (window.location.href = "main.html"), 600);
    } catch (err) {
      message.style.color = "#dc2626";
      message.textContent = `❌ ${err.message}`;
    }
  });

  // ---- Đăng ký ----
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("register-message");
    const fullName = document.getElementById("reg-fullname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    message.textContent = "Đang xử lý...";
    message.style.color = "";

    try {
      await request("/auth/register", {
        method: "POST",
        body: { email, password, full_name: fullName },
      });
      message.style.color = "#16a34a";
      message.textContent = "✅ Tạo tài khoản thành công! Hãy đăng nhập.";
      setTimeout(() => switchTab(true), 800);
    } catch (err) {
      message.style.color = "#dc2626";
      message.textContent = `❌ ${err.message}`;
    }
  });

  // ---- Lấy thông tin tài khoản (GET /auth/me) ----
  async function loadMe() {
    try {
      const user = await request("/auth/me", { auth: true });
      document.getElementById("me-name").textContent =
        user.full_name || user.email;
      document.getElementById("me-email").textContent = user.email;
      document.getElementById("me-role").textContent =
        user.role === "admin" ? "Quản trị viên" : "Người dùng";
      document.getElementById("me-created").textContent = new Date(
        user.created_at,
      ).toLocaleDateString("vi-VN");
      if (isAdmin()) document.getElementById("me-admin-link").hidden = false;
    } catch (err) {
      // Token hết hạn -> về form đăng nhập
      clearSession();
      window.location.reload();
    }
  }

  // ---- Đăng xuất ----
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "main.html";
  });
});
