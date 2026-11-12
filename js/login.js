// File: TRAFFIC_SYSTEM_FE/js/login.js
// Đăng nhập / Đăng ký / Xem thông tin tài khoản - gọi /auth/* trên Backend.

import {
  clearSession,
  isLoggedIn,
  request,
  saveSession,
} from "./api.js";

function getPasswordValidationMessage(password) {
  if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (!/\p{Lu}/u.test(password)) {
    return "Mật khẩu phải có ít nhất 1 ký tự viết hoa.";
  }
  if (!/\p{Nd}/u.test(password)) {
    return "Mật khẩu phải có ít nhất 1 chữ số.";
  }
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt.";
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const changePasswordForm = document.getElementById("change-password-form");
  const mePanel = document.getElementById("me-panel");
  const logoutButton = document.getElementById("logout-btn");
  const tabContainer = tabLogin.parentElement;

  logoutButton.addEventListener("click", () => {
    clearSession();
    window.location.replace("main.html");
  });

  // Đã đăng nhập -> hiện panel "tài khoản của tôi"
  if (isLoggedIn()) {
    tabLogin.textContent = "Tài khoản";
    tabRegister.textContent = "Đổi mật khẩu";
    tabContainer.hidden = false;
    loginForm.hidden = true;
    registerForm.hidden = true;
    tabLogin.addEventListener("click", () => switchAccountTab(true));
    tabRegister.addEventListener("click", () => switchAccountTab(false));
    switchAccountTab(true);
    initChangePassword();
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
    changePasswordForm.hidden = true;
    mePanel.hidden = true;
    logoutButton.hidden = true;
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
    const passwordError = getPasswordValidationMessage(password);
    if (passwordError) {
      message.style.color = "#dc2626";
      message.textContent = `❌ ${passwordError}`;
      return;
    }
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

  function switchAccountTab(showAccount) {
    tabLogin.classList.toggle("active", showAccount);
    tabRegister.classList.toggle("active", !showAccount);
    mePanel.hidden = !showAccount;
    changePasswordForm.hidden = showAccount;
    logoutButton.hidden = !showAccount;
  }

  function initChangePassword() {
    changePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("change-password-message");
      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const submitButton = changePasswordForm.querySelector('button[type="submit"]');

      const passwordError = getPasswordValidationMessage(newPassword);
      if (passwordError) {
        message.style.color = "#dc2626";
        message.textContent = `❌ ${passwordError}`;
        return;
      }

      if (newPassword !== confirmPassword) {
        message.style.color = "#dc2626";
        message.textContent = "❌ Mật khẩu nhập lại không khớp.";
        return;
      }

      submitButton.disabled = true;
      message.style.color = "";
      message.textContent = "Đang cập nhật mật khẩu...";
      try {
        await request("/auth/change-password", {
          method: "POST",
          body: {
            current_password: currentPassword,
            new_password: newPassword,
          },
          auth: true,
        });
        changePasswordForm.reset();
        message.style.color = "#16a34a";
        message.textContent = "✅ Đổi mật khẩu thành công.";
      } catch (err) {
        message.style.color = "#dc2626";
        message.textContent = `❌ ${err.message}`;
      } finally {
        submitButton.disabled = false;
      }
    });
  }

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
      document.getElementById("me-admin-link").hidden = user.role !== "admin";
    } catch (err) {
      // Token hết hạn -> về form đăng nhập
      clearSession();
      window.location.reload();
    }
  }
});
