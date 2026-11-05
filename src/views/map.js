import { h } from "../dom.js";
import { places, placeTypes } from "../data/places.js";
import { state } from "../state.js";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const DEFAULT_HOME = { lat: 40.9168, lng: -74.1718 }; // demo starting point in New Jersey

const miles = (a, b) => {
  const R = 3958.8, rad = (d) => (d * Math.PI) / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const loadScript = (src) => new Promise((res, rej) => {
  if (window.L) return res();
  document.head.append(h("script", { src, onload: res, onerror: () => rej(new Error("map library failed to load")) }));
});

export function mapView(ctx) {
  let home = { ...DEFAULT_HOME };
  const filters = { placement: true, benefits: true, training: true };
  const mapEl = h("div", { id: "map", class: "map" });
  const list = h("ul", { class: "cards" });
  const status = h("p", { class: "status" });
  let map, layer;

  const visible = () => places.filter((p) => placeTypes[p.type].help.some((k) => filters[k]))
    .map((p) => ({ ...p, dist: miles(home, p) })).sort((a, b) => a.dist - b.dist);

  function draw() {
    const rows = visible();
    list.replaceChildren(...rows.map((p) => h("li", { class: "card" },
      h("strong", {}, p.name, p.sample ? " (sample data)" : ""),
      h("div", {}, `${placeTypes[p.type].label} · ${p.dist.toFixed(1)} mi`),
      h("small", {}, `${p.address} · ${p.hours}`),
      h("div", { class: "row" },
        p.phone ? h("a", { class: "btn", href: `tel:${p.phone}` }, "Call") : null,
        h("a", { class: "btn", target: "_blank", rel: "noopener", href: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` }, "Directions")))));
    if (layer) {
      layer.clearLayers();
      rows.forEach((p) => window.L.marker([p.lat, p.lng]).bindPopup(`<strong>${p.name}</strong><br>${placeTypes[p.type].label}`).addTo(layer));
    }
  }

  const filterBox = h("fieldset", {}, h("legend", {}, "Type of help"),
    [["placement", "Job placement"], ["benefits", "Benefits & claims"], ["training", "Training"]].map(([k, l]) =>
      h("label", { class: "inline" }, h("input", { type: "checkbox", checked: true, onchange: (e) => { filters[k] = e.target.checked; draw(); } }), l)));

  const locate = h("button", { class: "secondary", onclick: () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      home = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map?.setView([home.lat, home.lng], 10); draw();
    }, () => (status.textContent = "Couldn't get your location; showing the demo area in New Jersey."));
  } }, "Use my location");

  Promise.all([loadScript(LEAFLET_JS), document.head.append(h("link", { rel: "stylesheet", href: LEAFLET_CSS }))]).then(() => {
    map = window.L.map(mapEl).setView([home.lat, home.lng], 9);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
    layer = window.L.layerGroup().addTo(map);
    draw();
  }).catch((e) => (status.textContent = `Map unavailable (${e.message}); the list below still works.`));

  draw();
  return h("section", {},
    h("h2", {}, "In-person help near you"),
    state.location ? h("p", { class: "rule" }, `Demo location: ${state.location}. This county is made up for the demo, and the pins are sample data.`) : null,
    h("p", { class: "privacy" }, "⚠️ Verify hours and phone numbers before you go. Locations should come from the official VA facility locator and the Department of Labor American Job Center directory."),
    h("p", {}, "Official lookup: ",
      h("a", { href: "https://www.va.gov/find-locations/", target: "_blank", rel: "noopener" }, "VA facility locator"), " · ",
      h("a", { href: "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx", target: "_blank", rel: "noopener" }, "American Job Centers")),
    filterBox, locate, status, mapEl, list,
    h("div", { class: "nav" }, h("button", { class: "secondary", onclick: ctx.back }, "Back")));
}
