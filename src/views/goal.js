import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { rankHorizons, scoreRole, HORIZONS, HORIZON_ORDER } from "../matching.js";
import { careers } from "../data/careers.js";
import { pathways } from "../data/pathways.js";
import { dreamThemes } from "../data/dreams.js";
import { skillLabels } from "../translate.js";
import { pills } from "../ui.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids);
  return el;
};
const usd = (n) => `$${Math.round(n / 1000)}k`;
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

// Every role, grouped by ring, for choosing a dream job. Used here and on the Opportunity Map.
export function dreamOptions(prof) {
  const all = careers.map((c) => scoreRole(c, prof));
  return [h("option", { value: "" }, "Choose a role"),
    ...HORIZON_ORDER.map((k) => h("optgroup", { label: `${HORIZONS[k].label} (${HORIZONS[k].span})` },
      all.filter((s) => s.horizon === k).sort((a, b) => a.role.title.localeCompare(b.role.title))
        .map((s) => h("option", { value: s.role.id }, s.role.title))))];
}

// Role names wrapped onto two short lines to fit inside a circle on the target.
function wrap(title, max = 17) {
  const lines = [];
  let cur = "";
  for (const w of title.split(" ")) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  lines.push(cur);
  if (lines.length > 3) { lines.length = 3; lines[2] = lines[2].replace(/.{1,2}$/, "…"); }
  return lines;
}

export function goalView(ctx) {
  const prof = profile();
  const groups = rankHorizons(prof);
  const clearFirst = (list) => [...list].sort((a, b) => a.blocked.length - b.blocked.length);
  const scored = new Map(careers.map((c) => [c.id, scoreRole(c, prof)]));
  const starts = clearFirst(groups.earn).slice(0, 3);
  const ideas = clearFirst([...groups.train, ...groups.big]).sort((a, b) => b.total - a.total).slice(0, 6);

  // Themes, best fit for this person first.
  const themes = dreamThemes.map((t) => {
    const roles = t.roles.filter((id) => scored.has(id));
    return { ...t, roles, fit: avg(roles.map((id) => scored.get(id).total)) };
  }).sort((a, b) => b.fit - a.fit);
  const topFit = new Set(themes.slice(0, 2).map((t) => t.id));

  const chart = h("div", { class: "target-wrap" });
  const picks = h("div", { class: "goal-picks", "aria-live": "polite" });
  const caption = h("p", { class: "legend" });

  function dreamRoles() {
    const theme = themes.find((t) => t.id === state.dreamTheme);
    const list = (theme ? theme.roles.map((id) => scored.get(id)) : ideas).slice(0, 6);
    const chosen = state.dream && !list.some((s) => s.role.id === state.dream) ? scored.get(state.dream) : null;
    return chosen ? [...list.slice(0, 5), chosen] : list;
  }

  function draw() {
    const outer = dreamRoles();
    const place = (list, radius, start) => list.map((s, i) => {
      const a = ((start + (i * 360) / list.length) * Math.PI) / 180;
      const x = Math.max(-236, Math.min(236, radius * Math.cos(a))); // keep circles inside the picture
      return { s, x: +x.toFixed(1), y: +(radius * Math.sin(a)).toFixed(1) };
    });
    const inner = place(starts, 136, -30);
    const far = place(outer, 244, -75);

    const root = svg("svg", { viewBox: "-300 -300 600 600", class: "target", role: "group", "aria-label": "Target: you in the center, where to start in the middle ring, dream targets in the outer ring" });
    root.append(
      svg("circle", { r: 292, class: "tgt-ring tgt-dream" }),
      svg("circle", { r: 200, class: "tgt-ring tgt-start" }),
      svg("circle", { r: 70, class: "tgt-ring tgt-you" }),
      svg("text", { y: -266, class: "tgt-label", "text-anchor": "middle" }, "DREAM TARGETS"),
      svg("text", { y: -176, class: "tgt-label tgt-label-start", "text-anchor": "middle" }, "WHERE TO START"),
      svg("text", { y: -4, class: "tgt-you-title", "text-anchor": "middle" }, "YOU"),
      svg("text", { y: 18, class: "tgt-you-sub", "text-anchor": "middle" }, `${prof.skills.length} skills`));

    const first = inner.find((p) => p.s.role.id === state.firstJob);
    const dream = far.find((p) => p.s.role.id === state.dream);
    if (first && dream) root.append(svg("line", { x1: first.x, y1: first.y, x2: dream.x, y2: dream.y, class: "tgt-path" }));

    const pill = (p, on, toggle, kind) => {
      const lines = wrap(p.s.role.title);
      const g = svg("g", { class: `tgt-pill ${kind}${on ? " selected" : ""}`, transform: `translate(${p.x} ${p.y})`, tabindex: 0, role: "button", "aria-pressed": String(on), "aria-label": p.s.role.title });
      const h2 = lines.length * 14 + 12; // taller when the name needs more lines
      g.append(svg("rect", { x: -60, y: -h2 / 2, width: 120, height: h2, rx: Math.min(18, h2 / 2) }),
        ...lines.map((t, i) => svg("text", { y: (i - (lines.length - 1) / 2) * 14 + 4, "text-anchor": "middle" }, t)));
      g.addEventListener("click", toggle);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      return g;
    };
    far.forEach((p) => root.append(pill(p, state.dream === p.s.role.id, () => { state.dream = state.dream === p.s.role.id ? null : p.s.role.id; draw(); }, "dream")));
    inner.forEach((p) => root.append(pill(p, state.firstJob === p.s.role.id, () => { state.firstJob = state.firstJob === p.s.role.id ? null : p.s.role.id; draw(); }, "start")));
    if (!starts.length) root.append(svg("text", { y: -120, class: "tgt-empty", "text-anchor": "middle" }, "No quick matches yet"));
    chart.replaceChildren(root);

    const theme = themes.find((t) => t.id === state.dreamTheme);
    caption.textContent = theme ? `Dream targets for “${theme.label}”. Tap one to aim for it.` : "Tap a circle to choose it. Not sure about your dream yet? Pick a theme above to see ideas.";

    // What's chosen, in plain words.
    const firstS = starts.find((s) => s.role.id === state.firstJob) || (state.firstJob && scored.get(state.firstJob));
    const dreamS = state.dream && scored.get(state.dream);
    picks.replaceChildren(
      h("div", { class: "pick" }, h("p", { class: "eyebrow" }, "Your first step"),
        firstS ? [h("h3", {}, firstS.role.title),
          h("p", {}, `${usd(firstS.role.pay.lo)}–${usd(firstS.role.pay.hi)}/yr (estimate) · about ${firstS.weeks} weeks to a first paycheck`),
          h("small", {}, `Uses your skills in: ${firstS.matchedSkills.map((t) => skillLabels[t]).join(", ") || "none yet"}`),
          firstS.blocked.length ? h("small", { class: "goal-warn" }, `Doesn't fully fit your limits: ${firstS.blocked.join(", ").toLowerCase()}`) : null]
          : h("p", { class: "pick-empty" }, "Tap a circle in the middle ring to choose where to start.")),
      h("div", { class: "pick dream" }, h("p", { class: "eyebrow" }, "Your dream target"),
        dreamS ? [h("h3", {}, dreamS.role.title), h("p", {}, pathways[dreamS.role.id].blurb),
          h("small", {}, `${usd(dreamS.role.pay.lo)}–${usd(dreamS.role.pay.hi)}/yr (estimate) · ${HORIZONS[dreamS.horizon].span} to get there`)]
          : h("p", { class: "pick-empty" }, "Tap a circle in the outer ring, or pick a theme above to see ideas.")));
  }

  const dreamSelect = h("select", { id: "goal-dream", onchange: (e) => { state.dream = e.target.value || null; draw(); } }, dreamOptions(prof));
  dreamSelect.value = state.dream || "";
  const note = h("textarea", { id: "goal-note", rows: 2, placeholder: "For example, running my own shop, or being home by 5", oninput: (e) => (state.dreamNote = e.target.value) }, state.dreamNote);

  const skillNames = prof.skillItems.filter((s) => s.confirmed).map((s) => s.corporate).slice(0, 4);
  const hero = h("div", { class: "hero" },
    h("p", { class: "eyebrow" }, "Your potential"),
    h("h2", {}, "You have plenty of skills, and they can take you far."),
    h("p", {}, "We want to help you see and actualize that potential, today and beyond. Start close to the center, then aim as far out as you dare."),
    skillNames.length ? h("p", { class: "hero-skills" }, `You already bring ${prof.skills.length} skills employers hire for, like ${skillNames.join(", ")}.`) : null);

  const themeBox = h("div", { class: "themes" },
    h("h3", {}, "Hard to picture your dream job? Start with what sounds like you."),
    pills({ options: themes.map((t) => [t.id, t.label, topFit.has(t.id) ? `★ Fits your skills · ${t.blurb}` : t.blurb]), selected: state.dreamTheme ? [state.dreamTheme] : [], single: true, label: "Dream themes",
      onchange: (sel) => { state.dreamTheme = sel[0] || null; draw(); } }));

  draw();
  return h("section", { class: "goal" },
    hero, themeBox,
    chart, caption, picks,
    h("details", { class: "goal-more" }, h("summary", {}, "Already know your dream job? Pick any role"),
      h("label", { for: "goal-dream", class: "sr-only" }, "Your dream job"), dreamSelect),
    h("label", { for: "goal-note" }, "Anything else you want from your career? (optional)"), note,
    h("div", { class: "nav" },
      h("button", { onclick: ctx.next }, "See my Opportunity Map"),
      h("button", { class: "secondary", onclick: () => { state.dream = null; state.dreamTheme = null; ctx.next(); } }, "I'm not sure yet")));
}
