"use strict";

const guideState = { data: null, map: null, markers: new Map(), route: null, selected: "ascott", direction: "toOffice" };
const byId = (id) => document.getElementById(id);
let toastTimer;

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function navigationUrl(place, direction = "fromOffice") {
  const office = guideState.data.office;
  const [origin, destination] = direction === "toOffice" ? [place, office] : [office, place];
  const params = new URLSearchParams({ api: "1", origin: `${origin.lat},${origin.lng}`, destination: `${destination.lat},${destination.lng}`, travelmode: "driving" });
  return `https://www.google.com/maps/dir/?${params}`;
}

function routeNumbers(route) {
  if (!route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) return null;
  return { km: (route.distance / 1000).toFixed(1), minutes: Math.max(1, Math.ceil(route.duration / 60)) };
}

function markerIcon(place, selected = false) {
  const size = matchMedia("(max-width: 760px)").matches ? 44 : place.id === "office" ? 36 : 32;
  return L.divIcon({ className: `map-pin${place.id === "office" ? " office-pin" : ""}${selected ? " is-selected" : ""}`, html: place.number, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function popupFor(place) {
  const box = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = place.name;
  const address = document.createElement("div");
  address.textContent = place.address;
  box.append(name, address);
  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener";
  link.href = place.id === "office" ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving` : navigationUrl(place);
  link.textContent = place.id === "office" ? "导航到公司 ↗" : "公司出发 ↗";
  box.append(link);
  if (place.id !== "office") {
    const back = document.createElement("a");
    back.href = navigationUrl(place, "toOffice");
    back.textContent = "导航回公司 ↗";
    back.target = "_blank";
    back.rel = "noopener";
    box.append(back);
  }
  return box;
}

function updateDistances() {
  document.querySelectorAll("[data-distance]").forEach((node) => {
    const info = routeNumbers(guideState.data.routes[node.dataset.distance]?.[guideState.direction]);
    node.textContent = info ? `${guideState.direction === "toOffice" ? "到公司" : "公司出发"} · ${info.km} km / 自驾参考 ${info.minutes} 分钟` : "路线暂不可用 · 请打开 Google Maps 查看";
  });
}

function renderRoute(fit = false) {
  const data = guideState.data;
  if (!data) return;
  const place = data.places.find((item) => item.id === guideState.selected);
  if (!place) return;
  const route = data.routes[place.id]?.[guideState.direction];
  const info = routeNumbers(route);
  byId("place-select").value = place.id;
  document.querySelectorAll("[data-direction]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.direction === guideState.direction)));
  byId("route-detail").querySelector(".route-caption").textContent = guideState.direction === "toOffice" ? `${place.name} → 公司` : `公司 → ${place.name}`;
  const stats = byId("route-detail").querySelector(".route-stats");
  stats.replaceChildren();
  if (info) {
    const distance = document.createElement("strong");
    distance.append(`${info.km} `);
    const km = document.createElement("small"); km.textContent = "km"; distance.append(km);
    const divider = document.createElement("span"); divider.className = "stat-divider";
    const duration = document.createElement("strong"); duration.append(`约 ${info.minutes} `);
    const minutes = document.createElement("small"); minutes.textContent = "分钟"; duration.append(minutes);
    stats.append(distance, divider, duration);
  } else {
    stats.textContent = "请在 Google Maps 查看路线";
  }
  byId("route-link").href = navigationUrl(place, guideState.direction);
  updateDistances();
  if (!guideState.map) return;
  guideState.markers.forEach((marker, id) => {
    const item = id === "office" ? data.office : data.places.find((p) => p.id === id);
    marker.setIcon(markerIcon(item, id === place.id));
    marker.setZIndexOffset(id === "office" ? 900 : id === place.id ? 800 : 0);
  });
  if (guideState.route) guideState.map.removeLayer(guideState.route);
  if (route?.geometry?.coordinates?.length) {
    guideState.route = L.geoJSON(route.geometry, { style: { color: "#427566", weight: 5, opacity: 0.88, lineCap: "round" } }).addTo(guideState.map);
    if (fit) guideState.map.fitBounds(guideState.route.getBounds(), { padding: [40, 45], maxZoom: 15, animate: !matchMedia("(prefers-reduced-motion: reduce)").matches });
  } else if (fit) {
    guideState.map.fitBounds([[place.lat, place.lng], [data.office.lat, data.office.lng]], { padding: [45, 45], maxZoom: 15 });
  }
}

function selectPlace(id, fit = true) {
  if (!guideState.data?.places.some((place) => place.id === id)) return;
  guideState.selected = id;
  renderRoute(fit);
}

function setupMap() {
  const data = guideState.data;
  if (!window.L) {
    byId("map").querySelector(".map-fallback").textContent = "地图未能加载。下方各事项的导航按钮仍可使用。";
    byId("map-reset").hidden = true;
    byId("map-drag").hidden = true;
    return;
  }
  byId("map").replaceChildren();
  const phone = matchMedia("(max-width: 760px)");
  const map = L.map("map", { scrollWheelZoom: false, dragging: !phone.matches, zoomControl: true, minZoom: 9, maxZoom: 18 }).setView([data.office.lat, data.office.lng], 13);
  guideState.map = map;
  phone.addEventListener("change", () => {
    if (phone.matches) map.dragging.disable(); else map.dragging.enable();
    byId("map-drag").setAttribute("aria-pressed", "false");
    byId("map-drag").textContent = "开启地图拖动";
    renderRoute();
  });
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
  let tileWarning = false;
  tiles.on("tileerror", () => {
    if (tileWarning) return;
    tileWarning = true;
    byId("map-help").textContent = "部分地图底图未载入；地点按钮、路线距离和 Google Maps 导航仍可使用。";
  });
  [data.office, ...data.places].forEach((place) => {
    const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place, place.id === guideState.selected), title: place.name, alt: place.name, keyboard: true, zIndexOffset: place.id === "office" ? 900 : 0 }).addTo(map);
    marker.bindTooltip(place.label, { direction: "top", offset: [0, -14] });
    marker.bindPopup(popupFor(place), { maxWidth: 250, autoPan: false });
    marker.on("click", () => { if (place.id !== "office") selectPlace(place.id, false); });
    guideState.markers.set(place.id, marker);
  });
  new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(byId("map"));
}

async function initialize() {
  try {
    const response = await fetch("./places.json?v=20260908a");
    if (!response.ok) throw new Error(`places ${response.status}`);
    const data = await response.json();
    if (!data.office || !Array.isArray(data.places) || !data.routes) throw new Error("地点资料缺失");
    guideState.data = data;
    setupMap();
    renderRoute();
  } catch (error) {
    const fallback = byId("map").querySelector(".map-fallback");
    if (fallback) fallback.textContent = "地图资料暂未加载，请使用事项里的 Google Maps 导航链接。";
    byId("map-help").textContent = "地图或资料加载遇到问题。页面上的静态导航与官方办理入口仍然有效。";
    byId("map-reset").hidden = true;
    byId("map-drag").hidden = true;
    byId("place-select").disabled = true;
    document.querySelectorAll("[data-direction]").forEach((button) => { button.disabled = true; });
    console.error("Guide initialization:", error);
  }
}

byId("place-select").addEventListener("change", (event) => selectPlace(event.target.value));
document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => {
  guideState.direction = button.dataset.direction;
  renderRoute(true);
}));
document.querySelectorAll("[data-map]").forEach((button) => button.addEventListener("click", () => {
  if (!guideState.data) { showToast("地图暂不可用，请点旁边的导航链接"); return; }
  selectPlace(button.dataset.map);
  byId("map-section").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  byId("place-select").focus({ preventScroll: true });
}));
byId("map-reset").addEventListener("click", () => {
  if (guideState.map) guideState.map.setView([guideState.data.office.lat, guideState.data.office.lng], 13);
});
byId("map-drag").addEventListener("click", () => {
  if (!guideState.map) return;
  const enabled = !guideState.map.dragging.enabled();
  if (enabled) guideState.map.dragging.enable(); else guideState.map.dragging.disable();
  byId("map-drag").setAttribute("aria-pressed", String(enabled));
  byId("map-drag").textContent = enabled ? "退出地图拖动" : "开启地图拖动";
});
document.querySelector("[data-copy-office]").addEventListener("click", async () => {
  const address = "Windows Office · RAYD2804, 8110 No. 88, Al Yasmeen, Riyadh 13322\nhttps://www.google.com/maps/search/?api=1&query=24.821698,46.6516289";
  try { await navigator.clipboard.writeText(address); showToast("公司地址和导航链接已复制"); }
  catch { showToast("复制未成功，可长按公司地址或导航链接复制"); }
});
initialize();
