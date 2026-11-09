// File: TRAFFIC_SYSTEM_FE/js/Map.js

document.addEventListener("DOMContentLoaded", () => {
  // 1. Màu sắc khớp chuẩn 100% với Legend CSS trong Map.html & main.html
  const TRAFFIC_COLORS = {
    green: "#22c55e",   // Thông thoáng (trên 30 km/h)
    yellow: "#eab308",  // Di chuyển chậm (15–30 km/h)
    red: "#ef4444",     // Ùn tắc nghiêm trọng (5–dưới 15 km/h)
    darkred: "#991b1b"  // Kẹt xe hoàn toàn (dưới 5 km/h)
  };

  const TRAFFIC_LABELS = {
    green: "Thông thoáng",
    yellow: "Di chuyển chậm",
    red: "Ùn tắc nghiêm trọng",
    darkred: "Kẹt xe hoàn toàn"
  };

  // 2. DOM Elements
  const statusOverlay = document.getElementById("status-overlay");
  const roadSearchForm = document.getElementById("road-search");
  const roadQueryInput = document.getElementById("road-query");
  const searchResultsUl = document.getElementById("search-results");
  const detailDiv = document.getElementById("detail");

  // 3. Khởi tạo Leaflet Map gắn vào #map-canvas (Căn giữa trung tâm Hà Nội)
  const map = L.map('map-canvas').setView([21.0180, 105.8150], 13);

  // Load Tile Layer từ OpenStreetMap
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });

  tileLayer.addTo(map);

  // Khi tải xong bản đồ -> Ẩn màn hình chờ (status-overlay)
  tileLayer.on('load', () => {
    if (statusOverlay) {
      statusOverlay.style.display = 'none';
    }
  });

  // 4. Danh sách mở rộng các cung đường giao thông trọng điểm Hà Nội (Tọa độ lòng đường thực tế)
  const trafficRoads = [
    {
      id: "R01",
      name: "Trục Nguyễn Trãi - Ngã Tư Sở - Tây Sơn",
      status: "darkred", // Kẹt xe hoàn toàn (< 5km/h)
      speed: "4 km/h",
      coordinates: [
        [20.9942, 105.8075], // Nút giao Khuất Duy Tiến - Nguyễn Trãi
        [20.9961, 105.8101], // Nguyễn Trãi (Vũ Trọng Phụng)
        [20.9978, 105.8124], // Nguyễn Trãi (Thượng Đình)
        [20.9997, 105.8148], // Nút giao Ngã Tư Sở
        [21.0028, 105.8183], // Tây Sơn (ĐH Thủy Lợi)
        [21.0062, 105.8217], // Tây Sơn (Chùa Bộc)
        [21.0090, 105.8235], // Tây Sơn (Ngã tư Thái Hà)
        [21.0135, 105.8270], // Ngã sáu Ô Chợ Dừa
        [21.0180, 105.8300]  // Tôn Đức Thắng
      ]
    },
    {
      id: "R02",
      name: "Đường Láng (Dọc sông Tô Lịch)",
      status: "red", // Ùn tắc nghiêm trọng (5-15km/h)
      speed: "11 km/h",
      coordinates: [
        [21.0330, 105.8010], // Nút giao Cầu Giấy - Láng
        [21.0285, 105.8032], // Láng (Chùa Láng)
        [21.0220, 105.8055], // Láng (Nguyễn Chí Thanh)
        [21.0175, 105.8080], // Láng (Lê Văn Lương)
        [21.0095, 105.8115], // Láng (Yên Lãng)
        [20.9997, 105.8148]  // Ngã Tư Sở
      ]
    },
    {
      id: "R03",
      name: "Trục Vành Đai 3 (Phạm Hùng - Khuất Duy Tiến - Nguyễn Xiển)",
      status: "darkred", // Kẹt xe hoàn toàn
      speed: "3 km/h",
      coordinates: [
        [21.0282, 105.7818], // Bến xe Mỹ Đình
        [21.0230, 105.7840], // Phạm Hùng (Mễ Trì)
        [21.0165, 105.7878], // Keangnam / Landmark 72
        [21.0085, 105.7945], // Nút giao Trần Duy Hưng
        [21.0015, 105.8010], // Khuất Duy Tiến (Lê Văn Lương)
        [20.9942, 105.8075], // Nút giao Nguyễn Trãi
        [20.9880, 105.8130], // Nguyễn Xiển (ĐH Thăng Long)
        [20.9800, 105.8205]  // Nút giao Linh Đàm
      ]
    },
    {
      id: "R04",
      name: "Đường Trường Chinh - Đại La - Minh Khai",
      status: "red", // Ùn tắc nghiêm trọng
      speed: "13 km/h",
      coordinates: [
        [20.9997, 105.8148], // Ngã Tư Sở
        [21.0012, 105.8210], // Trường Chinh (Tôn Thất Tùng)
        [21.0028, 105.8285], // Trường Chinh (Lê Trọng Tấn)
        [21.0035, 105.8340], // Ngã tư Vọng (Giải Phóng)
        [21.0020, 105.8400], // Đại La
        [21.0008, 105.8475], // Minh Khai (Chân cầu Vĩnh Tuy)
        [21.0000, 105.8620]  // Cầu Vĩnh Tuy
      ]
    },
    {
      id: "R05",
      name: "Trục Trần Duy Hưng - Nguyễn Chí Thanh - Liễu Giai",
      status: "yellow", // Di chuyển chậm (15-30km/h)
      speed: "24 km/h",
      coordinates: [
        [21.0085, 105.7945], // Trần Duy Hưng (Vành đai 3)
        [21.0150, 105.8000], // Cầu vượt Trần Duy Hưng - Nguyễn Chí Thanh
        [21.0220, 105.8055], // Nguyễn Chí Thanh (Huỳnh Thúc Kháng)
        [21.0260, 105.8110], // Nguyễn Chí Thanh (ĐH Luật)
        [21.0312, 105.8180]  // Liễu Giai (Lotte Center)
      ]
    },
    {
      id: "R06",
      name: "Trục Lê Văn Lương - Tố Hữu",
      status: "darkred", // Kẹt xe hoàn toàn
      speed: "4 km/h",
      coordinates: [
        [20.9810, 105.7600], // Tố Hữu (Vạn Phúc - Hà Đông)
        [20.9900, 105.7770], // Tố Hữu (Trung Văn)
        [21.0015, 105.8010], // Nút giao Khuất Duy Tiến - Lê Văn Lương
        [21.0050, 105.8045], // Lê Văn Lương (Hoàng Đạo Thúy)
        [21.0175, 105.8080]  // Lê Văn Lương (Đường Láng)
      ]
    },
    {
      id: "R07",
      name: "Trục Xã Đàn - Đại Cồ Việt - Trần Khát Chân (Vành Đai 1)",
      status: "yellow", // Di chuyển chậm
      speed: "20 km/h",
      coordinates: [
        [21.0135, 105.8270], // Ô Chợ Dừa
        [21.0120, 105.8340], // Xã Đàn (Phạm Ngọc Thạch)
        [21.0110, 105.8400], // Hầm chui Kim Liên
        [21.0105, 105.8460], // Đại Cồ Việt (Tạ Quang Bửu)
        [21.0100, 105.8550], // Trần Khát Chân (Phố Huế)
        [21.0090, 105.8630]  // Trần Khát Chân (Nguyễn Khoái)
      ]
    },
    {
      id: "R08",
      name: "Đường Giải Phóng - Lê Duẩn",
      status: "yellow", // Di chuyển chậm
      speed: "22 km/h",
      coordinates: [
        [20.9750, 105.8435], // Bến xe Nước Ngầm
        [20.9850, 105.8430], // Bến xe Giáp Bát
        [21.0035, 105.8340], // Ngã tư Vọng
        [21.0110, 105.8400], // Hầm chui Kim Liên
        [21.0225, 105.8410]  // Ga Hà Nội (Lê Duẩn)
      ]
    },
    {
      id: "R09",
      name: "Trục Võ Chí Công - Cầu Nhật Tân",
      status: "green", // Thông thoáng (> 30km/h)
      speed: "55 km/h",
      coordinates: [
        [21.0500, 105.8050], // Chợ Bưởi
        [21.0590, 105.8080], // Võ Chí Công (Hoàng Quốc Việt)
        [21.0680, 105.8105], // Võ Chí Công (Xuân La)
        [21.0790, 105.8140], // Võ Chí Công (Cầu Gương)
        [21.0920, 105.8180]  // Cầu Nhật Tân
      ]
    },
    {
      id: "R10",
      name: "Đường Phạm Văn Đồng - Cầu Thăng Long",
      status: "green", // Thông thoáng
      speed: "45 km/h",
      coordinates: [
        [21.0360, 105.7820], // Ngã tư Xuân Thủy - Phạm Văn Đồng
        [21.0480, 105.7825], // Phạm Văn Đồng (Hoàng Quốc Việt)
        [21.0620, 105.7830], // Cổ Nhuế
        [21.0780, 105.7860], // Công viên Hòa Bình
        [21.0980, 105.7890]  // Cầu Thăng Long
      ]
    },
    {
      id: "R11",
      name: "Đường Cầu Giấy - Kim Mã - Nguyễn Thái Học",
      status: "red", // Ùn tắc nghiêm trọng
      speed: "14 km/h",
      coordinates: [
        [21.0360, 105.7900], // Đường Cầu Giấy
        [21.0345, 105.7960], // Cầu Giấy (Trần Thái Tông)
        [21.0330, 105.8010], // Nút giao Cầu Giấy
        [21.0322, 105.8100], // Kim Mã (Đền Voi Phục)
        [21.0312, 105.8180], // Kim Mã (Liễu Giai)
        [21.0300, 105.8260], // Kim Mã (Giảng Võ)
        [21.0290, 105.8320]  // Nguyễn Thái Học
      ]
    },
    {
      id: "R12",
      name: "Phố Chùa Bộc - Thái Hà - Huỳnh Thúc Kháng",
      status: "red",
      speed: "10 km/h",
      coordinates: [
        [21.0062, 105.8217],
        [21.0080, 105.8280],
        [21.0090, 105.8235],
        [21.0150, 105.8180],
        [21.0220, 105.8055]
      ]
    }
  ];

  const mapPolylines = [];

  trafficRoads.forEach(road => {
    const color = TRAFFIC_COLORS[road.status] || "#94a3b8";

    const polyline = L.polyline(road.coordinates, {
      color: color,
      weight: 7,
      opacity: 0.88,
      smoothFactor: 1.0,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    mapPolylines.push({ roadData: road, polyline: polyline });

    polyline.on('click', () => {
      showRoadDetail(road, color);
    });

    polyline.on('mouseover', function () {
      this.setStyle({ weight: 11, opacity: 1.0 });
    });
    polyline.on('mouseout', function () {
      this.setStyle({ weight: 7, opacity: 0.88 });
    });
  });

  function showRoadDetail(road, color) {
    if (!detailDiv) return;

    detailDiv.hidden = false;
    detailDiv.innerHTML = `
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${road.name}</h2>
      <p style="margin-bottom: 6px;">Vận tốc trung bình: <strong>${road.speed}</strong></p>
      <p>Trạng thái: 
        <span style="background-color: ${color}; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 13px;">
          ${TRAFFIC_LABELS[road.status]}
        </span>
      </p>
    `;
  }

  if (roadSearchForm) {
    roadSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = roadQueryInput.value.trim().toLowerCase();
      if (!query) return;

      searchResultsUl.innerHTML = "";
      const matched = mapPolylines.filter(item => 
        item.roadData.name.toLowerCase().includes(query)
      );

      if (matched.length === 0) {
        searchResultsUl.innerHTML = `<li style="padding: 8px; color: #64748b;">Không tìm thấy tuyến đường phù hợp.</li>`;
        return;
      }

      matched.forEach(item => {
        const li = document.createElement('li');
        li.style.cursor = 'pointer';
        li.style.padding = '8px 12px';
        li.style.borderBottom = '1px solid #e2e8f0';
        li.innerHTML = `<strong>${item.roadData.name}</strong> - <small style="color:${TRAFFIC_COLORS[item.roadData.status]}">${TRAFFIC_LABELS[item.roadData.status]}</small>`;

        li.addEventListener('click', () => {
          map.fitBounds(item.polyline.getBounds());
          item.polyline.fire('click');
        });

        searchResultsUl.appendChild(li);
      });
    });
  }
});
