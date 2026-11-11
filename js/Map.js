// File: TRAFFIC_SYSTEM_FE/js/Map.js
// Cấu trúc dữ liệu khớp ERD:
//   Nodes(id, node_code, node_name, lat, lng)
//   Edges(id, edge_code, street_name, corridor_name, from_node, to_node, max_speed_limit, geom[LineString])
//   TrafficRecords(id, edge_id, speed, congestion_level[1..4], color_code)
//   Predictions(...) - dùng cho tính năng dự báo sau này

document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // 1. Mapping congestion_level (1..4) <-> màu / nhãn / tốc độ
  //    Khớp TrafficRecords.congestion_level + color_code trong ERD
  // ============================================================
  const CONGESTION_LEVELS = {
    1: { key: "green",   color: "#22c55e", label: "Thông thoáng",         speed: 45 }, // > 30 km/h
    2: { key: "yellow",  color: "#eab308", label: "Di chuyển chậm",       speed: 22 }, // 15-30 km/h
    3: { key: "red",     color: "#ef4444", label: "Ùn tắc nghiêm trọng",  speed: 11 }, // 5-15 km/h
    4: { key: "darkred", color: "#991b1b", label: "Kẹt xe hoàn toàn",     speed: 4  }  // < 5 km/h
  };

  // ============================================================
  // 2. Cấu hình API - khi backend sẵn sàng chỉ cần đổi BASE_URL
  // ============================================================
  const API_BASE_URL = "http://localhost:8080/api"; // TODO: đổi theo backend

  /**
   * Lớp Client gọi API theo ERD.
   * Mọi hàm đều trả về shape chuẩn, mock ở dưới cùng làm fallback offline.
   */
  const ApiClient = {
    /**
     * GET /edges (kèm traffic record mới nhất của từng edge)
     * Trả về: [{ edge_code, street_name, corridor_name, max_speed_limit,
     *            from: {node_code, node_name, lat, lng},
     *            to:   {node_code, node_name, lat, lng},
     *            congestion_level, color_code, speed }]
     */
    async fetchEdges() {
      try {
        const res = await fetch(`${API_BASE_URL}/edges`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return normalizeEdges(data);
      } catch (err) {
        console.warn("API /edges không khả dụng, dùng dữ liệu mock:", err.message);
        return normalizeEdges(MOCK_EDGES);
      }
    }
  };

  /**
   * Chuẩn hóa dữ liệu edge từ API về shape nội bộ của map.
   * Chấp nhận cả 2 dạng: edge lồng sẵn from/to, hoặc from_node_id/to_node_id
   * kèm danh sách nodes riêng.
   */
  function normalizeEdges(raw) {
    const nodesById = {};
    if (Array.isArray(raw.nodes)) {
      raw.nodes.forEach(n => { nodesById[n.id ?? n.node_code] = n; });
    }
    const list = Array.isArray(raw.edges) ? raw.edges : raw;

    return list.map(e => {
      const from = e.from || nodesById[e.from_node_id] || e.from_node || {};
      const to = e.to || nodesById[e.to_node_id] || e.to_node || {};
      const rec = e.latest_traffic || e.traffic_record || {};
      const level = Number(rec.congestion_level ?? e.congestion_level ?? 2);
      return {
        edge_code: e.edge_code || e.id,
        street_name: e.street_name || e.name || "",
        corridor_name: e.corridor_name || e.street_name || e.name || "",
        max_speed_limit: e.max_speed_limit || null,
        from: { node_code: from.node_code, node_name: from.node_name, lat: from.lat, lng: from.lng },
        to: { node_code: to.node_code, node_name: to.node_name, lat: to.lat, lng: to.lng },
        congestion_level: level,
        color_code: rec.color_code || CONGESTION_LEVELS[level]?.color,
        speed: rec.speed || null
      };
    });
  }

  // ============================================================
  // 3. MOCK DATA (fallback) - dạng EDGE khớp ERD
  //    corridor_name = trục đường (như "tuyến" trước đây)
  //    1 edge = 1 cung giữa 2 node; corridor được nhóm từ nhiều edge
  // ============================================================
  function node(code, name, lat, lng) {
    return { node_code: code, node_name: name, lat, lng };
  }

  // Các Node theo ERD (nút giao trọng điểm Hà Nội)
  const MOCK_NODES = [
    node("N01", "Nút giao Khuất Duy Tiến - Nguyễn Trãi", 20.9942, 105.8075),
    node("N02", "Nguyễn Trãi (Vũ Trọng Phụng)",           20.9961, 105.8101),
    node("N03", "Nguyễn Trãi (Thượng Đình)",              20.9978, 105.8124),
    node("N04", "Nút giao Ngã Tư Sở",                     20.9997, 105.8148),
    node("N05", "Tây Sơn (ĐH Thủy Lợi)",                  21.0028, 105.8183),
    node("N06", "Tây Sơn (Chùa Bộc)",                     21.0062, 105.8217),
    node("N07", "Tây Sơn (Ngã tư Thái Hà)",               21.0090, 105.8235),
    node("N08", "Ngã sáu Ô Chợ Dừa",                      21.0135, 105.8270),
    node("N09", "Tôn Đức Thắng",                          21.0180, 105.8300),
    node("N10", "Nút giao Cầu Giấy - Láng",               21.0330, 105.8010),
    node("N11", "Láng (Chùa Láng)",                       21.0285, 105.8032),
    node("N12", "Láng (Nguyễn Chí Thanh)",                21.0220, 105.8055),
    node("N13", "Láng (Lê Văn Lương)",                    21.0175, 105.8080),
    node("N14", "Láng (Yên Lãng)",                        21.0095, 105.8115),
    node("N15", "Bến xe Mỹ Đình",                         21.0282, 105.7818),
    node("N16", "Phạm Hùng (Mễ Trì)",                     21.0230, 105.7840),
    node("N17", "Keangnam / Landmark 72",                 21.0165, 105.7878),
    node("N18", "Nút giao Trần Duy Hưng",                 21.0085, 105.7945),
    node("N19", "Khuất Duy Tiến (Lê Văn Lương)",          21.0015, 105.8010),
    node("N20", "Nguyễn Xiển (ĐH Thăng Long)",            20.9880, 105.8130),
    node("N21", "Nút giao Linh Đàm",                      20.9800, 105.8205),
    node("N22", "Trường Chinh (Tôn Thất Tùng)",           21.0012, 105.8210),
    node("N23", "Trường Chinh (Lê Trọng Tấn)",            21.0028, 105.8285),
    node("N24", "Ngã tư Vọng (Giải Phóng)",               21.0035, 105.8340),
    node("N25", "Đại La",                                 21.0020, 105.8400),
    node("N26", "Minh Khai (Chân cầu Vĩnh Tuy)",          21.0008, 105.8475),
    node("N27", "Cầu Vĩnh Tuy",                           21.0000, 105.8620),
    node("N28", "Cầu vượt TDH - Nguyễn Chí Thanh",        21.0150, 105.8000),
    node("N29", "Nguyễn Chí Thanh (Huỳnh Thúc Kháng)",    21.0220, 105.8055),
    node("N30", "Nguyễn Chí Thanh (ĐH Luật)",             21.0260, 105.8110),
    node("N31", "Liễu Giai (Lotte Center)",               21.0312, 105.8180),
    node("N32", "Tố Hữu (Vạn Phúc - Hà Đông)",            20.9810, 105.7600),
    node("N33", "Tố Hữu (Trung Văn)",                     20.9900, 105.7770),
    node("N34", "Lê Văn Lương (Hoàng Đạo Thúy)",          21.0050, 105.8045),
    node("N35", "Xã Đàn (Phạm Ngọc Thạch)",               21.0120, 105.8340),
    node("N36", "Hầm chui Kim Liên",                      21.0110, 105.8400),
    node("N37", "Đại Cồ Việt (Tạ Quang Bửu)",             21.0105, 105.8460),
    node("N38", "Trần Khát Chân (Phố Huế)",               21.0100, 105.8550),
    node("N39", "Trần Khát Chân (Nguyễn Khoái)",          21.0090, 105.8630),
    node("N40", "Bến xe Nước Ngầm",                       20.9750, 105.8435),
    node("N41", "Bến xe Giáp Bát",                        20.9850, 105.8430),
    node("N42", "Ga Hà Nội (Lê Duẩn)",                    21.0225, 105.8410),
    node("N43", "Chợ Bưởi",                               21.0500, 105.8050),
    node("N44", "Võ Chí Công (Hoàng Quốc Việt)",          21.0590, 105.8080),
    node("N45", "Võ Chí Công (Xuân La)",                  21.0680, 105.8105),
    node("N46", "Võ Chí Công (Cầu Gương)",                21.0790, 105.8140),
    node("N47", "Cầu Nhật Tân",                           21.0920, 105.8180),
    node("N48", "Ngã tư Xuân Thủy - Phạm Văn Đồng",       21.0360, 105.7820),
    node("N49", "Phạm Văn Đồng (Hoàng Quốc Việt)",        21.0480, 105.7825),
    node("N50", "Cổ Nhuế",                                21.0620, 105.7830),
    node("N51", "Công viên Hòa Bình",                     21.0780, 105.7860),
    node("N52", "Cầu Thăng Long",                         21.0980, 105.7890),
    node("N53", "Đường Cầu Giấy",                         21.0360, 105.7900),
    node("N54", "Cầu Giấy (Trần Thái Tông)",              21.0345, 105.7960),
    node("N55", "Kim Mã (Đền Voi Phục)",                  21.0322, 105.8100),
    node("N56", "Kim Mã (Giảng Võ)",                      21.0300, 105.8260),
    node("N57", "Nguyễn Thái Học",                        21.0290, 105.8320),
    node("N58", "Thái Hà",                                21.0080, 105.8280),
    node("N59", "Huỳnh Thúc Kháng",                       21.0150, 105.8180)
  ];

  const N = Object.fromEntries(MOCK_NODES.map(n => [n.node_code, n]));

  /**
   * Tạo 1 edge: edge_code, street_name, corridor_name, from, to,
   * max_speed_limit, congestion_level (khớp TrafficRecords)
   */
  function edge(code, street, corridor, fromCode, toCode, maxSpeed, level, speed) {
    return {
      edge_code: code,
      street_name: street,
      corridor_name: corridor,
      max_speed_limit: maxSpeed,
      from: N[fromCode],
      to: N[toCode],
      congestion_level: level,
      color_code: CONGESTION_LEVELS[level].color,
      speed: speed ? `${speed} km/h` : null
    };
  }

  const MOCK_EDGES = [
    // ---- R01: Trục Nguyễn Trãi - Ngã Tư Sở - Tây Sơn ----
    edge("E0101", "Nguyễn Trãi",            "Nguyễn Trãi - Tây Sơn", "N01", "N02", 50, 4, 4),
    edge("E0102", "Nguyễn Trãi",            "Nguyễn Trãi - Tây Sơn", "N02", "N03", 50, 4, 4),
    edge("E0103", "Nguyễn Trãi",            "Nguyễn Trãi - Tây Sơn", "N03", "N04", 50, 3, 10),
    edge("E0104", "Tây Sơn",                "Nguyễn Trãi - Tây Sơn", "N04", "N05", 50, 3, 12),
    edge("E0105", "Tây Sơn",                "Nguyễn Trãi - Tây Sơn", "N05", "N06", 50, 2, 20),
    edge("E0106", "Tây Sơn",                "Nguyễn Trãi - Tây Sơn", "N06", "N07", 50, 2, 22),
    edge("E0107", "Tây Sơn",                "Nguyễn Trãi - Tây Sơn", "N07", "N08", 50, 1, 38),
    edge("E0108", "Tôn Đức Thắng",          "Nguyễn Trãi - Tây Sơn", "N08", "N09", 50, 1, 40),
    // ---- R02: Đường Láng ----
    edge("E0201", "Đường Láng",             "Đường Láng",            "N10", "N11", 60, 3, 12),
    edge("E0202", "Đường Láng",             "Đường Láng",            "N11", "N12", 60, 3, 10),
    edge("E0203", "Đường Láng",             "Đường Láng",            "N12", "N13", 60, 2, 18),
    edge("E0204", "Đường Láng",             "Đường Láng",            "N13", "N14", 60, 2, 20),
    edge("E0205", "Đường Láng",             "Đường Láng",            "N14", "N04", 60, 1, 35),
    // ---- R03: Vành Đai 3 ----
    edge("E0301", "Phạm Hùng",              "Vành Đai 3",            "N15", "N16", 80, 1, 55),
    edge("E0302", "Phạm Hùng",              "Vành Đai 3",            "N16", "N17", 80, 1, 50),
    edge("E0303", "Phạm Hùng",              "Vành Đai 3",            "N17", "N18", 80, 3, 12),
    edge("E0304", "Khuất Duy Tiến",         "Vành Đai 3",            "N18", "N19", 80, 4, 3),
    edge("E0305", "Khuất Duy Tiến",         "Vành Đai 3",            "N19", "N01", 80, 4, 3),
    edge("E0306", "Nguyễn Xiển",            "Vành Đai 3",            "N01", "N20", 80, 2, 20),
    edge("E0307", "Nguyễn Xiển",            "Vành Đai 3",            "N20", "N21", 80, 1, 45),
    // ---- R04: Trường Chinh - Đại La - Minh Khai ----
    edge("E0401", "Trường Chinh",           "Trường Chinh - Minh Khai", "N04", "N22", 60, 2, 20),
    edge("E0402", "Trường Chinh",           "Trường Chinh - Minh Khai", "N22", "N23", 60, 3, 12),
    edge("E0403", "Trường Chinh",           "Trường Chinh - Minh Khai", "N23", "N24", 60, 3, 10),
    edge("E0404", "Đại La",                 "Trường Chinh - Minh Khai", "N24", "N25", 60, 2, 18),
    edge("E0405", "Minh Khai",              "Trường Chinh - Minh Khai", "N25", "N26", 60, 1, 40),
    edge("E0406", "Minh Khai",              "Trường Chinh - Minh Khai", "N26", "N27", 60, 1, 42),
    // ---- R05: Trần Duy Hưng - Nguyễn Chí Thanh ----
    edge("E0501", "Trần Duy Hưng",          "Trần Duy Hưng - Liễu Giai", "N18", "N28", 60, 1, 42),
    edge("E0502", "Nguyễn Chí Thanh",       "Trần Duy Hưng - Liễu Giai", "N28", "N29", 60, 2, 22),
    edge("E0503", "Nguyễn Chí Thanh",       "Trần Duy Hưng - Liễu Giai", "N29", "N30", 60, 3, 10),
    edge("E0504", "Liễu Giai",              "Trần Duy Hưng - Liễu Giai", "N30", "N31", 60, 2, 24),
    // ---- R06: Lê Văn Lương - Tố Hữu ----
    edge("E0601", "Tố Hữu",                 "Lê Văn Lương - Tố Hữu", "N32", "N33", 60, 4, 4),
    edge("E0602", "Tố Hữu",                 "Lê Văn Lương - Tố Hữu", "N33", "N19", 60, 4, 4),
    edge("E0603", "Lê Văn Lương",           "Lê Văn Lương - Tố Hữu", "N19", "N34", 60, 3, 12),
    edge("E0604", "Lê Văn Lương",           "Lê Văn Lương - Tố Hữu", "N34", "N13", 60, 1, 45),
    // ---- R07: Vành Đai 1 (Xã Đàn - Trần Khát Chân) ----
    edge("E0701", "Xã Đàn",                 "Vành Đai 1",            "N08", "N35", 60, 2, 20),
    edge("E0702", "Xã Đàn",                 "Vành Đai 1",            "N35", "N36", 60, 1, 40),
    edge("E0703", "Đại Cồ Việt",            "Vành Đai 1",            "N36", "N37", 60, 1, 42),
    edge("E0704", "Trần Khát Chân",         "Vành Đai 1",            "N37", "N38", 60, 2, 20),
    edge("E0705", "Trần Khát Chân",         "Vành Đai 1",            "N38", "N39", 60, 2, 22),
    // ---- R08: Giải Phóng - Lê Duẩn ----
    edge("E0801", "Giải Phóng",             "Giải Phóng - Lê Duẩn",  "N40", "N41", 70, 2, 20),
    edge("E0802", "Giải Phóng",             "Giải Phóng - Lê Duẩn",  "N41", "N24", 70, 2, 24),
    edge("E0803", "Giải Phóng",             "Giải Phóng - Lê Duẩn",  "N24", "N36", 70, 1, 45),
    edge("E0804", "Lê Duẩn",                "Giải Phóng - Lê Duẩn",  "N36", "N42", 70, 1, 48),
    // ---- R09: Võ Chí Công - Cầu Nhật Tân ----
    edge("E0901", "Võ Chí Công",            "Võ Chí Công - Nhật Tân", "N43", "N44", 80, 1, 55),
    edge("E0902", "Võ Chí Công",            "Võ Chí Công - Nhật Tân", "N44", "N45", 80, 1, 55),
    edge("E0903", "Võ Chí Công",            "Võ Chí Công - Nhật Tân", "N45", "N46", 80, 1, 55),
    edge("E0904", "Võ Chí Công",            "Võ Chí Công - Nhật Tân", "N46", "N47", 80, 1, 55),
    // ---- R10: Phạm Văn Đồng ----
    edge("E1001", "Phạm Văn Đồng",          "Phạm Văn Đồng - Cầu Thăng Long", "N48", "N49", 70, 1, 48),
    edge("E1002", "Phạm Văn Đồng",          "Phạm Văn Đồng - Cầu Thăng Long", "N49", "N50", 70, 1, 48),
    edge("E1003", "Phạm Văn Đồng",          "Phạm Văn Đồng - Cầu Thăng Long", "N50", "N51", 70, 1, 48),
    edge("E1004", "Phạm Văn Đồng",          "Phạm Văn Đồng - Cầu Thăng Long", "N51", "N52", 70, 1, 48),
    // ---- R11: Cầu Giấy - Kim Mã ----
    edge("E1101", "Cầu Giấy",               "Cầu Giấy - Kim Mã",     "N53", "N54", 60, 3, 10),
    edge("E1102", "Cầu Giấy",               "Cầu Giấy - Kim Mã",     "N54", "N10", 60, 3, 12),
    edge("E1103", "Kim Mã",                 "Cầu Giấy - Kim Mã",     "N10", "N55", 60, 3, 12),
    edge("E1104", "Kim Mã",                 "Cầu Giấy - Kim Mã",     "N55", "N31", 60, 2, 20),
    edge("E1105", "Kim Mã",                 "Cầu Giấy - Kim Mã",     "N31", "N56", 60, 2, 22),
    edge("E1106", "Nguyễn Thái Học",        "Cầu Giấy - Kim Mã",     "N56", "N57", 60, 1, 35),
    // ---- R12: Chùa Bộc - Thái Hà ----
    edge("E1201", "Chùa Bộc",               "Chùa Bộc - Thái Hà",    "N06", "N58", 50, 3, 10),
    edge("E1202", "Thái Hà",                "Chùa Bộc - Thái Hà",    "N58", "N07", 50, 1, 38),
    edge("E1203", "Thái Hà",                "Chùa Bộc - Thái Hà",    "N07", "N59", 50, 2, 20),
    edge("E1204", "Huỳnh Thúc Kháng",       "Chùa Bộc - Thái Hà",    "N59", "N29", 50, 3, 10)
  ];

  // ============================================================
  // 4. DOM Elements & khởi tạo map
  // ============================================================
  const statusOverlay = document.getElementById("status-overlay");
  const roadSearchForm = document.getElementById("road-search");
  const roadQueryInput = document.getElementById("road-query");
  const searchResultsUl = document.getElementById("search-results");
  const detailDiv = document.getElementById("detail");

  const map = L.map('map-canvas').setView([21.0180, 105.8150], 13);

  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });
  tileLayer.addTo(map);

  tileLayer.on('load', () => {
    if (statusOverlay) statusOverlay.style.display = 'none';
  });

  // ============================================================
  // 5. Nhóm edge theo corridor (giống "tuyến" trên UI)
  //    -> groupEdges[corridor_name] = [edge, edge, ...]
  // ============================================================
  function groupByCorridor(edges) {
    const groups = new Map();
    edges.forEach(e => {
      const key = e.corridor_name || e.street_name;
      if (!groups.has(key)) {
        groups.set(key, {
          corridor_name: key,
          edges: []
        });
      }
      groups.get(key).edges.push(e);
    });
    // Sắp edge trong corridor theo thứ tự nối (from -> to cạnh nhau)
    groups.forEach(g => {
      g.edges.sort((a, b) => {
        const idxA = a.from ? a.from.lat + a.from.lng : 0;
        const idxB = b.from ? b.from.lat + b.from.lng : 0;
        return idxA - idxB;
      });
    });
    return Array.from(groups.values());
  }

  // ============================================================
  // 6. Logic vẽ map
  // ============================================================
  const mapPolylines = []; // { corridor, segmentLayers, distances, totalKm, avgSpeed, maxSpeedLimit }

  function haversine(a, b) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad;
    const dLng = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /** Khoảng cách từ điểm P tới đoạn thẳng AB (mét) */
  function distToSegment(p, a, b) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const ax = a[1] * rad, ay = a[0] * rad;
    const bx = b[1] * rad, by = b[0] * rad;
    const px = p[1] * rad, py = p[0] * rad;
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return haversine(p, a);
    const cosLat = Math.cos((a[0] + b[0]) / 2 * rad);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx * cosLat + (py - ay) * dy) /
      (dx * dx * cosLat * cosLat + dy * dy)));
    const projX = ax + t * dx, projY = ay + t * dy;
    const midLat = (projY + p[0]) / 2;
    const dLat = (projY - p[0]) * Math.PI * R / 180;
    const dLng = (projX - p[1]) * Math.PI * R * Math.cos(midLat * rad) / 180;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  /** Tổng chiều dài polyline (mét) */
  function polylineLength(pts) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += haversine(pts[i - 1], pts[i]);
    }
    return total;
  }

  /**
   * Gọi OSRM để snap cặp node from/to của 1 edge về đúng lòng đường thực tế.
   * 1 edge = 1 cung -> route chỉ có 1 leg.
   */
  async function snapEdgeGeometry(from, to) {
    const coordStr = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=true`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || !data.routes.length) return null;

      const route = data.routes[0];
      const leg = route.legs[0];
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
      return { pts, distance: leg.distance };
    } catch (err) {
      console.warn('OSRM snap thất bại:', err);
      return null;
    }
  }

  /**
   * Lọc bỏ nhánh ngõ / dò dòng trong geometry của 1 edge.
   * Corridor = đoạn thẳng from -> to của edge (vì 1 edge là 1 cung ngắn).
   */
  function filterEdgeCorridor(pts, from, to, maxDist = 60) {
    const dists = pts.map(p => distToSegment(p, [from.lat, from.lng], [to.lat, to.lng]));
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    for (let j = 0; j < pts.length; j++) {
      if (dists[j] <= maxDist) {
        if (curStart === -1) curStart = j;
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else {
        curStart = -1; curLen = 0;
      }
    }
    if (bestLen >= 2) {
      const trimmed = pts.slice(bestStart, bestStart + bestLen);
      return { pts: trimmed, distance: polylineLength(trimmed) };
    }
    return { pts, distance: polylineLength(pts) };
  }

  /**
   * Vận tốc trung bình corridor = trung bình điều hòa theo quãng đường từng edge:
   * avg = totalDist / Σ(dist_i / v_i)
   * Mỗi edge dùng speed thật từ TrafficRecords nếu có, ngược lại dùng
   * tốc độ đại diện của congestion_level.
   */
  function computeCorridorStats(corridor, distances) {
    let totalTime = 0, totalDist = 0;
    corridor.edges.forEach((e, i) => {
      const d = distances ? distances[i] : haversine(
        [e.from.lat, e.from.lng], [e.to.lat, e.to.lng]);
      const speedNum = e.speed ? parseFloat(e.speed) : CONGESTION_LEVELS[e.congestion_level].speed;
      totalTime += d / speedNum;
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
   * Vẽ 1 corridor: mỗi edge 1 polyline, màu theo congestion_level của edge.
   */
  async function drawCorridor(corridor) {
    const entry = {
      corridor,
      segmentLayers: [],
      distances: null,
      totalKm: null,
      avgSpeed: null,
      maxSpeedLimit: Math.max(...corridor.edges.map(e => e.max_speed_limit || 0)) || null
    };
    mapPolylines.push(entry);

    // Vẽ ngay bản dự phòng từng edge (nối from -> to)
    corridor.edges.forEach(e => {
      const style = CONGESTION_LEVELS[e.congestion_level] || { color: "#94a3b8" };
      const segLine = L.polyline(
        [[e.from.lat, e.from.lng], [e.to.lat, e.to.lng]],
        { ...LINE_STYLE, color: style.color }
      ).addTo(map);
      entry.segmentLayers.push(segLine);
    });

    bindCorridorEvents(entry);

    // Snap geometry từng edge về lòng đường thật + lọc nhánh ngõ
    const distances = [];
    const snappedList = await Promise.all(corridor.edges.map(e =>
      snapEdgeGeometry(e.from, e.to)
    ));

    snappedList.forEach((snapped, i) => {
      const e = corridor.edges[i];
      if (snapped && snapped.pts.length > 1) {
        const cleaned = filterEdgeCorridor(snapped.pts, e.from, e.to);
        entry.segmentLayers[i].setLatLngs(cleaned.pts);
        distances.push(cleaned.distance);
      } else {
        distances.push(haversine([e.from.lat, e.from.lng], [e.to.lat, e.to.lng]));
      }
    });

    entry.distances = distances;
    const stats = computeCorridorStats(corridor, distances);
    entry.totalKm = stats ? stats.totalKm : null;
    entry.avgSpeed = stats ? stats.avgSpeed : null;
  }

  function bindCorridorEvents(entry) {
    const group = L.featureGroup(entry.segmentLayers);

    group.on('click', () => showCorridorDetail(entry));

    group.on('mouseover', () => {
      entry.segmentLayers.forEach(l => l.setStyle({ weight: 11, opacity: 1.0 }));
    });
    group.on('mouseout', () => {
      entry.segmentLayers.forEach(l => l.setStyle({ weight: 7, opacity: 0.88 }));
    });
  }

  function fmt(n, digits = 1) {
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: digits });
  }

  function showCorridorDetail(entry) {
    const corridor = entry.corridor;
    if (!detailDiv) return;

    const rows = corridor.edges.map((e, i) => {
      const lvl = CONGESTION_LEVELS[e.congestion_level];
      const distM = entry.distances ? entry.distances[i] : haversine(
        [e.from.lat, e.from.lng], [e.to.lat, e.to.lng]);
      const speedTxt = e.speed
        ? `${e.speed}`
        : `~${lvl.speed} km/h`;
      return `
        <li style="display:flex; align-items:center; gap:8px; padding:4px 0;">
          <span style="width:14px; height:14px; border-radius:50%; background:${e.color_code || lvl.color}; flex-shrink:0;"></span>
          <span style="flex:1;">
            ${e.street_name}
            <small style="color:#64748b;">(${e.from.node_name} → ${e.to.node_name})</small>
          </span>
          <small style="color:#334155; white-space:nowrap;">${speedTxt}</small>
          <small style="color:#64748b;">${fmt(distM / 1000)} km</small>
        </li>`;
    }).join('');

    detailDiv.hidden = false;
    detailDiv.innerHTML = `
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${corridor.corridor_name}</h2>
      <p style="margin-bottom: 6px;">Vận tốc trung bình: <strong>${entry.avgSpeed ? fmt(entry.avgSpeed) + ' km/h' : 'đang cập nhật...'}</strong></p>
      <p style="margin-bottom: 6px;">Tổng chiều dài: <strong>${entry.totalKm ? fmt(entry.totalKm) + ' km' : '--'}</strong></p>
      ${entry.maxSpeedLimit ? `<p style="margin-bottom: 6px;">Giới hạn tốc độ: <strong>${entry.maxSpeedLimit} km/h</strong></p>` : ''}
      <p style="margin-bottom: 4px;">Trạng thái theo từng cung (${corridor.edges.length} cung):</p>
      <ul style="list-style:none; padding:0; margin:0 0 8px 0;">${rows}</ul>
    `;
  }

  // ============================================================
  // 7. Khởi động: fetch edges từ API (hoặc mock) -> nhóm -> vẽ
  // ============================================================
  (async () => {
    const edges = await ApiClient.fetchEdges();
    const corridors = groupByCorridor(edges);

    for (const corridor of corridors) {
      await drawCorridor(corridor);
    }
  })();

  // ============================================================
  // 8. Tìm kiếm theo tên trục / tên đường (client-side trên dữ liệu đã load)
  // ============================================================
  if (roadSearchForm) {
    roadSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = roadQueryInput.value.trim().toLowerCase();
      if (!query) return;

      searchResultsUl.innerHTML = "";
      const matched = mapPolylines.filter(item =>
        item.corridor.corridor_name.toLowerCase().includes(query) ||
        item.corridor.edges.some(e => e.street_name.toLowerCase().includes(query))
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
        li.innerHTML = `<strong>${item.corridor.corridor_name}</strong>${speedTxt}`;

        li.addEventListener('click', () => {
          const bounds = L.featureGroup(item.segmentLayers).getBounds();
          map.fitBounds(bounds);
          showCorridorDetail(item);
        });

        searchResultsUl.appendChild(li);
      });
    });
  }
});
