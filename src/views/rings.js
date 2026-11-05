import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { rankRoles, RINGS, WEIGHTS } from "../matching.js";
import { credentials } from "../data/credentials.js";
import { skillLabels } from "../translate.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids);
  return el;
};
const pct = (n) => `${Math.round(n * 100)}%`;
const usd = (n) => `$${Math.round(n / 1000)}k`;

export function ringsView(ctx) {
  const prof = profile();
  const { rings, top } = rankRoles(prof);
  if (!state.selected && top) state.selected = top.role.id;
  const all = [...rings.strong, ...rings.stretch, ...rings.reach];
  const detail = h("div", { class: "detail", "aria-live": "polite" });
  const cardEls = new Map();

  function select(id) {
    state.selected = id;
    const s = all.find((x) => x.role.id === id);
    cardEls.forEach((el, k) => el.classList.toggle("selected", k === id));
    dots.forEach((d, k) => d.classList.toggle("selected", k === id));
    detail.replaceChildren(...explain(s));
  }

  // Concentric circles: strong (centre) -> stretch -> reach (outer).
  const radii = { strong: [0, 105], stretch: [105, 195], reach: [195, 285] };
  const chart = svg("svg", { viewBox: "-300 -300 600 600", class: "rings", role: "img", "aria-label": "Career matches in three rings" });
  ["reach", "stretch", "strong"].forEach((k, i) => chart.append(svg("circle", { r: radii[k][1], class: `ring ring-${k}` })));
  const dots = new Map();
  let n = 0;
  for (const k of ["strong", "stretch", "reach"]) {
    const list = rings[k];
    const mid = (radii[k][0] + radii[k][1]) / 2;
    list.forEach((s, i) => {
      n += 1;
      const angle = (i / list.length) * Math.PI * 2 + (k === "stretch" ? 0.6 : k === "reach" ? 1.2 : 0);
      const r = k === "strong" && list.length === 1 ? 0 : mid;
      const g = svg("g", { class: `dot dot-${k}`, transform: `translate(${(r * Math.cos(angle)).toFixed(1)} ${(r * Math.sin(angle)).toFixed(1)})`, tabindex: 0, role: "button", "aria-label": s.role.title });
      g.append(svg("circle", { r: 17 }), svg("text", { "text-anchor": "middle", dy: "5" }, String(n)));
      g.addEventListener("click", () => select(s.role.id));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") select(s.role.id); });
      dots.set(s.role.id, g); chart.append(g);
      s.n = n;
    });
  }

  function explain(s) {
    const missingList = s.missing.map((c) => credentials[c].name);
    return [
      h("h3", {}, `${s.n}. ${s.role.title}`),
      h("p", { class: `badge badge-${s.ring}` }, `${RINGS[s.ring].label} · ${pct(s.total)} match`),
      h("p", {}, h("strong", {}, "Why this ring: "), RINGS[s.ring].rule,
        s.blocked.length ? ` It was moved out one ring because of: ${s.blocked.join(", ").toLowerCase()}.` : "",
        missingList.length ? ` Missing: ${missingList.join("; ")}.` : " Nothing missing."),
      h("table", { class: "score" },
        h("tr", {}, h("th", {}, "Part"), h("th", {}, "Score"), h("th", {}, "Weight")),
        h("tr", {}, h("td", {}, `Skills match (${s.matchedSkills.length} of ${s.role.skills.length} skills)`), h("td", {}, pct(s.skills)), h("td", {}, pct(WEIGHTS.skills))),
        h("tr", {}, h("td", {}, "Constraint match"), h("td", {}, pct(s.constraints)), h("td", {}, pct(WEIGHTS.constraints))),
        h("tr", {}, h("td", {}, "Interest match"), h("td", {}, pct(s.interests)), h("td", {}, pct(WEIGHTS.interests)))),
      h("ul", { class: "checks" }, s.checks.map((c) => h("li", { class: c.pass ? "ok" : "no" }, `${c.pass ? "✓" : "✗"} ${c.label}: ${c.detail}`))),
      h("p", {}, h("small", {}, `Skills you already have: ${s.matchedSkills.map((t) => skillLabels[t]).join(", ") || "none yet"}.`)),
      h("button", { onclick: () => { state.selected = s.role.id; ctx.next(); } }, "See gaps & this week's action")
    ];
  }

  const card = (s) => {
    const el = h("li", { class: "card", tabindex: 0, onclick: () => select(s.role.id), onkeydown: (e) => { if (e.key === "Enter") select(s.role.id); } },
      h("strong", {}, `${s.n}. ${s.role.title}`),
      h("div", {}, `${usd(s.role.pay.lo)}–${usd(s.role.pay.hi)}/yr · ${s.role.hours === "days" ? "days" : s.role.hours === "mixed" ? "days + on-call" : "shifts"} · ${pct(s.total)}`),
      h("small", {}, s.role.requires.length ? `Requires: ${s.role.requires.map((c) => credentials[c].name).join(", ")}` : "No extra credential required"),
      s.missing.length ? h("small", { class: "missing" }, `Missing: ${s.missing.map((c) => credentials[c].name).join(", ")}`) : null);
    cardEls.set(s.role.id, el);
    return el;
  };

  const out = h("section", {},
    h("h2", {}, "Your career matches"),
    h("p", { class: "rule" }, `Score = ${pct(WEIGHTS.skills)} skills match + ${pct(WEIGHTS.constraints)} constraint match (hours, distance, timing, pay) + ${pct(WEIGHTS.interests)} interest match. Tap a role to see why it sits where it does. Pay ranges are illustrative estimates.`),
    h("div", { class: "rings-layout" }, h("div", {}, chart, h("p", { class: "legend" }, "Centre: strong fit · Middle: stretch · Outer: reach")), detail),
    ["strong", "stretch", "reach"].map((k) => h("div", {}, h("h3", {}, `${RINGS[k].label} (${rings[k].length})`),
      rings[k].length ? h("ul", { class: "cards" }, rings[k].map(card)) : h("p", {}, "No roles in this ring for your answers."))),
    h("div", { class: "nav" }, h("button", { onclick: ctx.next }, "See gaps & this week's action")));
  if (state.selected) setTimeout(() => select(state.selected), 0);
  return out;
}
