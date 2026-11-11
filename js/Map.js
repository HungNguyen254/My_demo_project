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

  // Vận tốc đại diện (km/h) cho từng mức trạng thái - dùng để tính trung bình
  const STATUS_SPEED = {
    green: 45,
    yellow: 22,
    red: 11,
    darkred: 4
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

  // 4. Các tuyến đường trọng điểm Hà Nội.
  // Mỗi tuyến gồm nhiều SEGMENT (chặng giữa 2 waypoint liên tiếp), mỗi chặng
  // có trạng thái riêng -> cùng 1 tuyến có chỗ thông thoáng, chỗ tắc như Google Maps.
  const trafficRoads = [
    {
      id: "R01",
      name: "Trục Nguyễn Trãi - Ngã Tư Sở - Tây Sơn",
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
      ],
      segments: [
        { status: "darkred" }, // Khuất Duy Tiến -> Vũ Trọng Phụng
        { status: "darkred" }, // -> Thượng Đình
        { status: "red"     }, // -> Ngã Tư Sở
        { status: "red"     }, // -> ĐH Thủy Lợi
        { status: "yellow"  }, // -> Chùa Bộc
        { status: "yellow"  }, // -> Ngã tư Thái Hà
        { status: "green"   }, // -> Ô Chợ Dừa
        { status: "green"   }  // -> Tôn Đức Thắng
      ]
    },
    {
      id: "R02",
      name: "Đường Láng (Dọc sông Tô Lịch)",
      coordinates: [
        [21.0330, 105.8010], // Nút giao Cầu Giấy - Láng
        [21.0285, 105.8032], // Láng (Chùa Láng)
        [21.0220, 105.8055], // Láng (Nguyễn Chí Thanh)
        [21.0175, 105.8080], // Láng (Lê Văn Lương)
        [21.0095, 105.8115], // Láng (Yên Lãng)
        [20.9997, 105.8148]  // Ngã Tư Sở
      ],
      segments: [
        { status: "red"    },
        { status: "red"    },
        { status: "yellow" },
        { status: "yellow" },
        { status: "green"  }
      ]
    },
    {
      id: "R03",
      name: "Trục Vành Đai 3 (Phạm Hùng - Khuất Duy Tiến - Nguyễn Xiển)",
      coordinates: [
        [21.0282, 105.7818], // Bến xe Mỹ Đình
        [21.0230, 105.7840], // Phạm Hùng (Mễ Trì)
        [21.0165, 105.7878], // Keangnam / Landmark 72
        [21.0085, 105.7945], // Nút giao Trần Duy Hưng
        [21.0015, 105.8010], // Khuất Duy Tiến (Lê Văn Lương)
        [20.9942, 105.8075], // Nút giao Nguyễn Trãi
        [20.9880, 105.8130], // Nguyễn Xiển (ĐH Thăng Long)
        [20.9800, 105.8205]  // Nút giao Linh Đàm
      ],
      segments: [
        { status: "green"   },
        { status: "green"   },
        { status: "red"     },
        { status: "darkred" },
        { status: "darkred" },
        { status: "yellow"  },
        { status: "green"   }
      ]
    },
    {
      id: "R04",
      name: "Đường Trường Chinh - Đại La - Minh Khai",
      coordinates: [
        [20.9997, 105.8148], // Ngã Tư Sở
        [21.0012, 105.8210], // Trường Chinh (Tôn Thất Tùng)
        [21.0028, 105.8285], // Trường Chinh (Lê Trọng Tấn)
        [21.0035, 105.8340], // Ngã tư Vọng (Giải Phóng)
        [21.0020, 105.8400], // Đại La
        [21.0008, 105.8475], // Minh Khai (Chân cầu Vĩnh Tuy)
        [21.0000, 105.8620]  // Cầu Vĩnh Tuy
      ],
      segments: [
        { status: "yellow" },
        { status: "red"    },
        { status: "red"    },
        { status: "yellow" },
        { status: "green"  },
        { status: "green"  }
      ]
    },
    {
      id: "R05",
      name: "Trục Trần Duy Hưng - Nguyễn Chí Thanh - Liễu Giai",
      coordinates: [
        [21.0085, 105.7945], // Trần Duy Hưng (Vành đai 3)
        [21.0150, 105.8000], // Cầu vượt Trần Duy Hưng - Nguyễn Chí Thanh
        [21.0220, 105.8055], // Nguyễn Chí Thanh (Huỳnh Thúc Kháng)
        [21.0260, 105.8110], // Nguyễn Chí Thanh (ĐH Luật)
        [21.0312, 105.8180]  // Liễu Giai (Lotte Center)
      ],
      segments: [
        { status: "green"  },
        { status: "yellow" },
        { status: "red"    },
        { status: "yellow" }
      ]
    },
    {
      id: "R06",
      name: "Trục Lê Văn Lương - Tố Hữu",
      coordinates: [
        [20.9810, 105.7600], // Tố Hữu (Vạn Phúc - Hà Đông)
        [20.9900, 105.7770], // Tố Hữu (Trung Văn)
        [21.0015, 105.8010], // Nút giao Khuất Duy Tiến - Lê Văn Lương
        [21.0050, 105.8045], // Lê Văn Lương (Hoàng Đạo Thúy)
        [21.0175, 105.8080]  // Lê Văn Lương (Đường Láng)
      ],
      segments: [
        { status: "darkred" },
        { status: "darkred" },
        { status: "red"     },
        { status: "green"   }
      ]
    },
    {
      id: "R07",
      name: "Trục Xã Đàn - Đại Cồ Việt - Trần Khát Chân (Vành Đai 1)",
      coordinates: [
        [21.0135, 105.8270], // Ô Chợ Dừa
        [21.0120, 105.8340], // Xã Đàn (Phạm Ngọc Thạch)
        [21.0110, 105.8400], // Hầm chui Kim Liên
        [21.0105, 105.8460], // Đại Cồ Việt (Tạ Quang Bửu)
        [21.0100, 105.8550], // Trần Khát Chân (Phố Huế)
        [21.0090, 105.8630]  // Trần Khát Chân (Nguyễn Khoái)
      ],
      segments: [
        { status: "yellow" },
        { status: "green"  },
        { status: "green"  },
        { status: "yellow" },
        { status: "yellow" }
      ]
    },
    {
      id: "R08",
      name: "Đường Giải Phóng - Lê Duẩn",
      coordinates: [
        [20.9750, 105.8435], // Bến xe Nước Ngầm
        [20.9850, 105.8430], // Bến xe Giáp Bát
        [21.0035, 105.8340], // Ngã tư Vọng
        [21.0110, 105.8400], // Hầm chui Kim Liên
        [21.0225, 105.8410]  // Ga Hà Nội (Lê Duẩn)
      ],
      segments: [
        { status: "yellow" },
        { status: "yellow" },
        { status: "green"  },
        { status: "green"  }
      ]
    },
    {
      id: "R09",
      name: "Trục Võ Chí Công - Cầu Nhật Tân",
      coordinates: [
        [21.0500, 105.8050], // Chợ Bưởi
        [21.0590, 105.8080], // Võ Chí Công (Hoàng Quốc Việt)
        [21.0680, 105.8105], // Võ Chí Công (Xuân La)
        [21.0790, 105.8140], // Võ Chí Công (Cầu Gương)
        [21.0920, 105.8180]  // Cầu Nhật Tân
      ],
      segments: [
        { status: "green" },
        { status: "green" },
        { status: "green" },
        { status: "green" }
      ]
    },
    {
      id: "R10",
      name: "Đường Phạm Văn Đồng - Cầu Thăng Long",
      coordinates: [
        [21.0360, 105.7820], // Ngã tư Xuân Thủy - Phạm Văn Đồng
        [21.0480, 105.7825], // Phạm Văn Đồng (Hoàng Quốc Việt)
        [21.0620, 105.7830], // Cổ Nhuế
        [21.0780, 105.7860], // Công viên Hòa Bình
        [21.0980, 105.7890]  // Cầu Thăng Long
      ],
      segments: [
        { status: "green" },
        { status: "green" },
        { status: "green" },
        { status: "green" }
      ]
    },
    {
      id: "R11",
      name: "Đường Cầu Giấy - Kim Mã - Nguyễn Thái Học",
      coordinates: [
        [21.0360, 105.7900], // Đường Cầu Giấy
        [21.0345, 105.7960], // Cầu Giấy (Trần Thái Tông)
        [21.0330, 105.8010], // Nút giao Cầu Giấy
        [21.0322, 105.8100], // Kim Mã (Đền Voi Phục)
        [21.0312, 105.8180], // Kim Mã (Liễu Giai)
        [21.0300, 105.8260], // Kim Mã (Giảng Võ)
        [21.0290, 105.8320]  // Nguyễn Thái Học
      ],
      segments: [
        { status: "red"    },
        { status: "red"    },
        { status: "red"    },
        { status: "yellow" },
        { status: "yellow" },
        { status: "green"  }
      ]
    },
    {
      id: "R12",
      name: "Phố Chùa Bộc - Thái Hà - Huỳnh Thúc Kháng",
      coordinates: [
        [21.0062, 105.8217], // Chùa Bộc
        [21.0080, 105.8280], // Thái Hà
        [21.0090, 105.8235], // Thái Hà (chợ)
        [21.0150, 105.8180], // Huỳnh Thúc Kháng
        [21.0220, 105.8055]  // Nguyễn Chí Thanh
      ],
      segments: [
        { status: "red"    },
        { status: "green"  },
        { status: "yellow" },
        { status: "red"    }
      ]
    }
  ];

  const mapPolylines = []; // { roadData, segmentLayers: [polyline], distMeters: [m], totalKm, avgSpeed }

  /**
   * Tính khoảng cách đường chim bay giữa 2 điểm (m) - dùng khi offline/fallback.
   */
  function haversine(a, b) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad;
    const dLng = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /**
   * Gọi OSRM để snap các waypoint về đúng lòng đường thực tế.
   * Trả về: { legs: [[lat,lng]...mỗi chặng 1 mảng], distances: [m] } hoặc null nếu lỗi.
   * Bật steps=true để tách geometry theo từng leg (chặng giữa 2 waypoint).
   */
  async function snapToRealRoad(coordinates) {
    const coordStr = coordinates.map(c => `${c[1]},${c[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=true`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || !data.routes.length) return null;

      const route = data.routes[0];
      const legs = route.legs.map(leg => {
        // Ghép geometry của các step trong leg -> polyline của đúng chặng này
        const pts = [];
        leg.steps.forEach(step => {
          step.geometry.coordinates.forEach(c => {
            const latlng = [c[1], c[0]];
            const last = pts[pts.length - 1];
            if (!last || last[0] !== latlng[0] || last[1] !== latlng[1]) {
              pts.push(latlng);
            }
          });
        });
        return pts;
      });
      const distances = route.legs.map(leg => leg.distance); // mét

      return { legs, distances };
    } catch (err) {
      console.warn('OSRM snap thất bại, dùng tọa độ dự phòng:', err);
      return null;
    }
  }

  /**
   * Lọc bỏ các điểm bị OSRM dẫn vào ngõ nhỏ / dò dòng để nối 2 waypoint.
   * Hành lang (corridor) = chuỗi waypoint gốc của tuyến nằm trên trục chính.
   * Điểm nào cách corridor quá MAX_CORRIDOR_DIST (mét) -> bỏ.
   * Đồng thời tính lại quãng đường từng chặng theo geometry đã lọc.
   */
  function filterToMainCorridor(legs, waypoints) {
    const MAX_CORRIDOR_DIST = 60; // mét - trục chính thì phải sát corridor
    const filteredLegs = [];
    const filteredDistances = [];

    legs.forEach((pts, i) => {
      const wpA = waypoints[i];
      const wpB = waypoints[i + 1];
      if (!pts || pts.length < 2) {
        filteredLegs.push(pts);
        filteredDistances.push(haversine(wpA, wpB));
        return;
      }

      // Với từng điểm của chặng, tìm khoảng cách nhỏ nhất tới các đoạn của corridor
      const dists = pts.map(p => {
        let minDist = Infinity;
        for (let k = 0; k < waypoints.length - 1; k++) {
          const d = distToSegment(p, waypoints[k], waypoints[k + 1]);
          if (d < minDist) minDist = d;
        }
        return minDist;
      });

      // Chỉ giữ các điểm nằm trong hành lang trục chính.
      // KHÔNG ép giữ điểm đầu/cuối chặng nữa -> nhánh ngõ nhỏ ở đầu/cuối cũng bị cắt.
      const keep = pts.filter((_, j) => dists[j] <= MAX_CORRIDOR_DIST);

      // Nếu lọc đến mức mất hết / chỉ còn 1 điểm -> giữ nguyên chặng gốc
      // (coi như chặng này nằm trên trục chính, không nên cố lọc)
      if (keep.length < 2) {
        filteredLegs.push(pts);
        filteredDistances.push(polylineLength(pts));
        return;
      }

      // Cắt gọn: tìm dãy điểm LIÊN TIẾP dài nhất nằm trong corridor ->
      // mọi nhánh chìa ra (đầu/cuối/giữa chặng) đều bị loại vì không thuộc dãy này.
      let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
      for (let j = 0; j < pts.length; j++) {
        if (dists[j] <= MAX_CORRIDOR_DIST) {
          if (curStart === -1) curStart = j;
          curLen++;
          if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
        } else {
          curStart = -1; curLen = 0;
        }
      }

      if (bestLen >= 2) {
        // Cắt về đúng dãy liên tiếp dài nhất trong corridor -> không còn nhánh rẽ
        const trimmed = pts.slice(bestStart, bestStart + bestLen);
        filteredLegs.push(trimmed);
        filteredDistances.push(polylineLength(trimmed));
      } else {
        filteredLegs.push(keep);
        filteredDistances.push(polylineLength(keep));
      }
    });

    return { legs: filteredLegs, distances: filteredDistances };
  }

  /** Khoảng cách từ điểm P tới đoạn thẳng AB (mét) */
  function distToSegment(p, a, b) {
    const R = 6371000;
    const rad = Math.PI / 180;
    // Chuyển về hệ x,y phẳng xấp xỉ quanh vĩ độ Hà Nội (dx đã nhân cos(lat))
    const ax = a[1] * rad, ay = a[0] * rad;
    const bx = b[1] * rad, by = b[0] * rad;
    const px = p[1] * rad, py = p[0] * rad;
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return haversine(p, a);
    const cosLat = Math.cos((a[0] + b[0]) / 2 * rad);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx * cosLat + (py - ay) * dy) /
      (dx * dx * cosLat * cosLat + dy * dy)));
    const projX = ax + t * dx, projY = ay + t * dy;
    // Chuyển lại khoảng cách về mét
    const midLat = (projY + p[0]) / 2;
    const dLat = (projY - p[0]) * Math.PI * R / 180;
    const dLng = (projX - p[1]) * Math.PI * R * Math.cos(midLat * rad) / 180;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  /** Tổng chiều dài một polyline (mảng [lat,lng]) tính bằng mét */
  function polylineLength(pts) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += haversine(pts[i - 1], pts[i]);
    }
    return total;
  }

  /**
   * Vận tốc trung bình của tuyến = trung bình điều hòa có trọng số quãng đường:
   * avg = totalDist / Σ(dist_i / v_i)   (giống cách Google/TomTom tổng hợp thời gian di chuyển)
   */
  function computeAverageSpeed(road, distances) {
    let totalTime = 0;
    let totalDist = 0;
    road.segments.forEach((seg, i) => {
      const d = distances ? distances[i] : haversine(road.coordinates[i], road.coordinates[i + 1]);
      totalTime += d / STATUS_SPEED[seg.status];
      totalDist += d;
    });
    if (!totalDist) return null;
    return { avgSpeed: totalDist / totalTime, totalKm: totalDist / 1000 };
  }

  const LINE_STYLE = {
    weight: 7,
    opacity: 0.88,
    smoothFactor: 1.0,
    lineCap: 'round',
    lineJoin: 'round'
  };

  /**
   * Vẽ 1 tuyến: mỗi chặng 1 polyline màu theo trạng thái riêng của chặng đó.
   */
  async function drawRoad(road) {
    // Tạo entry trước và push ngay -> sự kiện click/hover có thể dùng nó,
    // các thông số (avgSpeed, totalKm...) sẽ được cập nhật sau khi có dữ liệu OSRM.
    const entry = { roadData: road, segmentLayers: [], distances: null, totalKm: null, avgSpeed: null };
    mapPolylines.push(entry);

    const segmentLayers = entry.segmentLayers;

    // 4.1. Vẽ ngay bản dự phòng (đường chim bay giữa các waypoint) từng chặng
    for (let i = 0; i < road.segments.length; i++) {
      const color = TRAFFIC_COLORS[road.segments[i].status] || "#94a3b8";
      const segLine = L.polyline([road.coordinates[i], road.coordinates[i + 1]], {
        ...LINE_STYLE,
        color
      }).addTo(map);
      segmentLayers.push(segLine);
    }

    bindRoadEvents(entry);

    // 4.2. Gọi OSRM lấy lòng đường thật theo từng chặng rồi thay thế.
    // Lọc bỏ những đoạn OSRM dẫn vào ngõ nhỏ / dò dòng để nối 2 waypoint,
    // chỉ giữ lại phần bám sát trục chính của tuyến.
    const snapped = await snapToRealRoad(road.coordinates);
    if (snapped && snapped.legs.length === road.segments.length) {
      const cleaned = filterToMainCorridor(snapped.legs, road.coordinates);
      cleaned.legs.forEach((pts, i) => {
        if (pts.length > 1) {
          segmentLayers[i].setLatLngs(pts);
        }
      });
      snapped.distances = cleaned.distances;
    }

    // 4.3. Tính toán vận tốc trung bình theo quãng đường thật
    const stats = computeAverageSpeed(road, snapped ? snapped.distances : null);

    entry.distances = snapped ? snapped.distances : null;
    entry.totalKm = stats ? stats.totalKm : null;
    entry.avgSpeed = stats ? stats.avgSpeed : null;
  }

  function bindRoadEvents(entry) {
    const group = L.featureGroup(entry.segmentLayers);

    group.on('click', () => showRoadDetail(entry));

    group.on('mouseover', () => {
      entry.segmentLayers.forEach(l => l.setStyle({ weight: 11, opacity: 1.0 }));
    });
    group.on('mouseout', () => {
      entry.segmentLayers.forEach(l => l.setStyle({ weight: 7, opacity: 0.88 }));
    });
  }

  (async () => {
    for (const road of trafficRoads) {
      await drawRoad(road);
    }
  })();

  function fmt(n, digits = 1) {
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: digits });
  }

  function showRoadDetail(entry) {
    const road = entry.roadData;
    if (!detailDiv) return;

    // Danh sách từng chặng kèm màu + quãng đường
    const rows = road.segments.map((seg, i) => {
      const distM = entry.distances ? entry.distances[i] : haversine(road.coordinates[i], road.coordinates[i + 1]);
      return `
        <li style="display:flex; align-items:center; gap:8px; padding:4px 0;">
          <span style="width:14px; height:14px; border-radius:50%; background:${TRAFFIC_COLORS[seg.status]}; flex-shrink:0;"></span>
          <span style="flex:1;">${TRAFFIC_LABELS[seg.status]}</span>
          <small style="color:#64748b;">${fmt(distM / 1000)} km</small>
        </li>`;
    }).join('');

    detailDiv.hidden = false;
    detailDiv.innerHTML = `
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${road.name}</h2>
      <p style="margin-bottom: 6px;">Vận tốc trung bình: <strong>${entry.avgSpeed ? fmt(entry.avgSpeed) + ' km/h' : 'đang cập nhật...'}</strong></p>
      <p style="margin-bottom: 6px;">Tổng chiều dài: <strong>${entry.totalKm ? fmt(entry.totalKm) + ' km' : '--'}</strong></p>
      <p style="margin-bottom: 4px;">Trạng thái theo từng chặng:</p>
      <ul style="list-style:none; padding:0; margin:0 0 8px 0;">${rows}</ul>
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
        const speedTxt = item.avgSpeed ? ` - <small style="color:#475569">${fmt(item.avgSpeed)} km/h TB</small>` : '';
        const li = document.createElement('li');
        li.style.cursor = 'pointer';
        li.style.padding = '8px 12px';
        li.style.borderBottom = '1px solid #e2e8f0';
        li.innerHTML = `<strong>${item.roadData.name}</strong>${speedTxt}`;

        li.addEventListener('click', () => {
          const bounds = L.featureGroup(item.segmentLayers).getBounds();
          map.fitBounds(bounds);
          showRoadDetail(item);
        });

        searchResultsUl.appendChild(li);
      });
    });
  }
});
