// File: TRAFFIC_SYSTEM_FE/js/main.js

const API_BASE_URL = "http://localhost:8080/api";

const CONGESTION_MAP = {
  1: { key: "green",   colorClass: "green",   textClass: "text-green",   label: "Thông thoáng",        speedDefault: 45 },
  2: { key: "yellow",  colorClass: "yellow",  textClass: "text-yellow",  label: "Di chuyển chậm",      speedDefault: 22 },
  3: { key: "red",     colorClass: "red",     textClass: "text-red",     label: "Ùn tắc nghiêm trọng", speedDefault: 11 },
  4: { key: "darkred", colorClass: "darkred", textClass: "text-darkred", label: "Kẹt xe hoàn toàn",    speedDefault: 4  }
};

document.addEventListener("DOMContentLoaded", () => {
  initBackendConnection();
  loadForecastData();
  loadHotspotsData();
});

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
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      output.style.color = "#16a34a";
      output.textContent = `✅ ${data.message || "Kết nối Backend thành công!"} (${data.timestamp || new Date().toLocaleTimeString()})`;
    } catch (err) {
      output.style.color = "#dc2626";
      output.textContent = `❌ Không thể kết nối Backend (${err.message}). Đang dùng dữ liệu offline.`;
    }
  });
}

/**
 * 2. Tải dữ liệu dự báo theo khung giờ từ Backend (hoặc Mock fallback)
 */
async function loadForecastData() {
  const tableDiv = document.querySelector(".forecast-table");
  if (!tableDiv) return;

  let forecastList = [];
  try {
    const res = await fetch(`${API_BASE_URL}/predictions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    forecastList = await res.json();
  } catch (err) {
    console.warn("API /predictions chưa sẵn sàng, dùng MOCK_FORECAST_DATA:", err.message);
    forecastList = MOCK_FORECAST_DATA;
  }

  renderForecastTable(tableDiv, forecastList);
}

function renderForecastTable(container, list) {
  if (!Array.isArray(list) || list.length === 0) return;

  container.innerHTML = list.map(item => {
    const slots = item.time_slots || {};
    
    const renderSlot = (slotKey, slotData) => {
      if (!slotData) return '';
      const lvl = CONGESTION_MAP[slotData.congestion_level] || CONGESTION_MAP[2];
      const speed = slotData.speed ?? lvl.speedDefault;
      const percent = Math.min(100, Math.max(10, Math.round((1 - speed / 60) * 100)));
      
      return `
        <div class="level ${slotKey} ${lvl.colorClass}">
          <div class="bar-track"><div class="bar" style="width: ${percent}%;"></div></div>
          <span>${speed} km/h · ${slotData.label || lvl.label}</span>
        </div>
      `;
    };

    return `
      <div class="row">
        <a class="route" href="Map.html?q=${encodeURIComponent(item.corridor_name)}" tabindex="0">
          <strong>${item.corridor_name}</strong>
          <small>${item.sub_text || ""}</small>
        </a>
        ${renderSlot("slot-1", slots.slot_1)}
        ${renderSlot("slot-2", slots.slot_2)}
        ${renderSlot("slot-3", slots.slot_3)}
        ${renderSlot("slot-4", slots.slot_4)}
      </div>
    `;
  }).join('');
}

/**
 * 3. Tải danh sách điểm nóng ùn tắc từ Backend (hoặc Mock fallback)
 */
async function loadHotspotsData() {
  const gridDiv = document.querySelector("#hotspots .grid");
  if (!gridDiv) return;

  let hotspots = [];
  try {
    const res = await fetch(`${API_BASE_URL}/hotspots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    hotspots = await res.json();
  } catch (err) {
    console.warn("API /hotspots chưa sẵn sàng, dùng MOCK_HOTSPOTS_DATA:", err.message);
    hotspots = MOCK_HOTSPOTS_DATA;
  }

  renderHotspots(gridDiv, hotspots);
}

function renderHotspots(container, list) {
  if (!Array.isArray(list) || list.length === 0) return;

  container.innerHTML = list.map(item => {
    const lvl = CONGESTION_MAP[item.congestion_level] || CONGESTION_MAP[3];
    return `
      <article class="card hotspot-card" tabindex="0">
        <h3>${item.node_name}</h3>
        <p class="level-label hotspot-index ${lvl.textClass}">${item.label || lvl.label}</p>
      </article>
    `;
  }).join('');
}

// ============================================================
// MOCK DATA FALLBACK (Dùng khi Backend offline)
// ============================================================
const MOCK_FORECAST_DATA = [
  {
    corridor_name: "Nguyễn Trãi - Ngã Tư Sở - Tây Sơn",
    sub_text: "Nút giao Khuất Duy Tiến → Tôn Đức Thắng",
    time_slots: {
      slot_1: { speed: 4,  congestion_level: 4, label: "Kẹt xe hoàn toàn" },
      slot_2: { speed: 22, congestion_level: 2, label: "Di chuyển chậm" },
      slot_3: { speed: 11, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_4: { speed: 42, congestion_level: 1, label: "Thông thoáng" }
    }
  },
  {
    corridor_name: "Đường Láng",
    sub_text: "Cầu Giấy → Ngã Tư Sở (dọc sông Tô Lịch)",
    time_slots: {
      slot_1: { speed: 11, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_2: { speed: 21, congestion_level: 2, label: "Di chuyển chậm" },
      slot_3: { speed: 13, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_4: { speed: 38, congestion_level: 1, label: "Thông thoáng" }
    }
  },
  {
    corridor_name: "Trục Vành Đai 3",
    sub_text: "Phạm Hùng - Khuất Duy Tiến - Nguyễn Xiển",
    time_slots: {
      slot_1: { speed: 12, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_2: { speed: 3,  congestion_level: 4, label: "Kẹt xe hoàn toàn" },
      slot_3: { speed: 3,  congestion_level: 4, label: "Kẹt xe hoàn toàn" },
      slot_4: { speed: 50, congestion_level: 1, label: "Thông thoáng" }
    }
  },
  {
    corridor_name: "Trục Lê Văn Lương - Tố Hữu",
    sub_text: "Vạn Phúc (Hà Đông) → Đường Láng",
    time_slots: {
      slot_1: { speed: 4,  congestion_level: 4, label: "Kẹt xe hoàn toàn" },
      slot_2: { speed: 9,  congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_3: { speed: 12, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_4: { speed: 45, congestion_level: 1, label: "Thông thoáng" }
    }
  },
  {
    corridor_name: "Đường Phạm Văn Đồng",
    sub_text: "Ngã tư Xuân Thủy → Cầu Thăng Long",
    time_slots: {
      slot_1: { speed: 48, congestion_level: 1, label: "Thông thoáng" },
      slot_2: { speed: 45, congestion_level: 1, label: "Thông thoáng" },
      slot_3: { speed: 28, congestion_level: 2, label: "Di chuyển chậm" },
      slot_4: { speed: 46, congestion_level: 1, label: "Thông thoáng" }
    }
  },
  {
    corridor_name: "Cầu Giấy - Kim Mã - Nguyễn Thái Học",
    sub_text: "Cầu Giấy → Nguyễn Thái Học",
    time_slots: {
      slot_1: { speed: 11, congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
      slot_2: { speed: 21, congestion_level: 2, label: "Di chuyển chậm" },
      slot_3: { speed: 4,  congestion_level: 4, label: "Kẹt xe hoàn toàn" },
      slot_4: { speed: 35, congestion_level: 1, label: "Thông thoáng" }
    }
  }
];

const MOCK_HOTSPOTS_DATA = [
  { node_name: "Ngã Tư Sở", congestion_level: 4, label: "Kẹt xe hoàn toàn" },
  { node_name: "Nút giao Khuất Duy Tiến - Nguyễn Trãi", congestion_level: 4, label: "Kẹt xe hoàn toàn" },
  { node_name: "Nút giao Trần Duy Hưng", congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
  { node_name: "Ngã tư Cầu Giấy", congestion_level: 3, label: "Ùn tắc nghiêm trọng" },
  { node_name: "Hầm chui Kim Liên", congestion_level: 1, label: "Thông thoáng" },
  { node_name: "Đường Phạm Hùng (Mễ Trì)", congestion_level: 1, label: "Thông thoáng" }
];
