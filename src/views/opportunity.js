import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { rankRoles, rankHorizons, buildPath, scoreRole, HORIZONS, HORIZON_ORDER, WEIGHTS } from "../matching.js";
import { careers } from "../data/careers.js";
import { credentials } from "../data/credentials.js";
import { pathways } from "../data/pathways.js";
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
const payRange = (role) => `${usd(role.pay.lo)}–${usd(role.pay.hi)}/yr`;
const SCHEDULE = { days: ["Often daytime", "sched-days"], mixed: ["Shifts vary", "sched-vary"], shifts: ["Nights or rotating", "sched-vary"] };
const MODE_CLASS = { "Hands-on": "mode-hands", Mix: "mode-mix", "Desk + floor": "mode-floor", Desk: "mode-floor" };
const skillNames = (tags) => tags.map((t) => skillLabels[t]).join(", ");

function timeLabel(s) {
  if (!s.missing.length) return `About ${s.weeks} weeks`;
  const m = Math.round(s.months);
  if (m >= 24) return `About ${Math.round(m / 12)} years`;
  return `About ${m} month${m === 1 ? "" : "s"}`;
}

// "by January" from the date the user needs income, or a neutral phrase without one.
function earnBy(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? "soon" : `by ${d.toLocaleString("en-US", { month: "long", timeZone: "UTC" })}`;
}

export function opportunityView(ctx) {
  const prof = profile();
  const groups = rankHorizons(prof);
  const { top } = rankRoles(prof);
  if (!state.selected && top) state.selected = top.role.id;
  const scoreOf = (id) => scoreRole(careers.find((c) => c.id === id), prof);
  const by = earnBy(state.answers.incomeBy);
  const needDays = state.answers.daysOnly || state.answers.childcare;
  const leads = {
    earn: `${needDays ? "Day-shift work" : "Work"} that can get you paid ${by} and build civilian experience.`,
    train: "Worth a few months of training: one credential can open these doors.",
    big: "Apprenticeships and advancement paths that take longer and can pay more."
  };

  // ---- Rings ----
  const pills = {};
  const circles = {};
  const markers = svg("g", { "aria-hidden": "true" });
  const chart = svg("svg", { viewBox: "-300 -300 600 600", class: "opp-rings", role: "group", "aria-label": "Opportunity map with three rings. Choose a ring to see its roles." });
  const geometry = { big: { r: 292, pill: -238, mark: 245 }, train: { r: 196, pill: -142, mark: 150 }, earn: { r: 100, pill: -14, mark: 56 } };
  for (const k of ["big", "train", "earn"]) {
    const c = svg("circle", { r: geometry[k].r, class: `opp-ring opp-ring-${k}` });
    c.addEventListener("click", () => pickRing(k));
    circles[k] = c;
    chart.append(c);
  }
  for (const k of HORIZON_ORDER) {
    const y = geometry[k].pill;
    const g = svg("g", { class: "opp-pill", transform: `translate(0 ${y})`, tabindex: 0, role: "button", "aria-label": `${HORIZONS[k].label}, ${HORIZONS[k].span}` });
    g.append(svg("rect", { x: -80, y: -30, width: 160, height: 60, rx: 30 }),
      svg("text", { class: "opp-pill-title", "text-anchor": "middle", y: -4 }, HORIZONS[k].label),
      svg("text", { class: "opp-pill-span", "text-anchor": "middle", y: 17 }, HORIZONS[k].span));
    g.addEventListener("click", () => pickRing(k));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickRing(k); } });
    pills[k] = g;
    chart.append(g);
  }
  chart.append(markers);

  const marker = (label, y, cls) => {
    const w = label.length * 9 + 22;
    return svg("g", { class: `opp-marker ${cls}`, transform: `translate(0 ${y})` },
      svg("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13 }),
      svg("text", { "text-anchor": "middle", y: 5 }, label));
  };
  function paintMarkers() {
    const path = state.dream ? buildPath(state.dream, prof) : null;
    const m = [];
    if (path?.direct) m.push(marker("★ Dream job", geometry.earn.mark, "marker-dream"));
    else if (path) {
      const sameRing = path.dream.horizon === "earn"; // both markers must fit inside the small inner circle
      if (path.first) m.push(marker("First job", sameRing ? 36 : geometry.earn.mark, "marker-first"));
      m.push(marker("★ Dream job", sameRing ? 66 : geometry[path.dream.horizon].mark, "marker-dream"));
    }
    markers.replaceChildren(...m);
  }

  // ---- Dream-job path ----
  const pathBox = h("div", { class: "path-steps", "aria-live": "polite" });
  const dreamSelect = h("select", { id: "dream-job", onchange: (e) => setDream(e.target.value || null) });
  {
    const all = careers.map((c) => scoreRole(c, prof));
    dreamSelect.append(h("option", { value: "" }, "Choose a role"),
      ...HORIZON_ORDER.map((k) => h("optgroup", { label: `${HORIZONS[k].label} (${HORIZONS[k].span})` },
        all.filter((s) => s.horizon === k).sort((a, b) => a.role.title.localeCompare(b.role.title))
          .map((s) => h("option", { value: s.role.id }, s.role.title)))));
    dreamSelect.value = state.dream || "";
  }

  const dreamButtons = new Map();
  function setDream(id) {
    state.dream = id;
    if (id) state.selected = id;
    dreamSelect.value = id || "";
    paintPath();
    paintMarkers();
    dreamButtons.forEach((b, k) => setDreamButton(b, k));
  }
  const setDreamButton = (b, id) => {
    const on = state.dream === id;
    b.textContent = on ? "★ Your dream job" : "Make this my dream job";
    b.setAttribute("aria-pressed", String(on));
  };

  function paintPath() {
    if (!state.dream) {
      pathBox.replaceChildren(h("p", { class: "path-empty" }, "Choose a dream job to see the steps from your first paycheck to where you want to end up."));
      return;
    }
    const p = buildPath(state.dream, prof);
    const step = (eyebrow, title, ...body) => h("li", { class: "path-step" }, h("p", { class: "eyebrow" }, eyebrow), h("h4", {}, title), ...body);
    if (p.direct) {
      pathBox.replaceChildren(h("ol", { class: "path" },
        step("Short term · dream job", p.dream.role.title,
          h("p", {}, `You could go straight for this one: ${timeLabel(p.dream).toLowerCase()} to a first paycheck, with nothing missing.`))));
      return;
    }
    const creds = p.credentials.map((c) => credentials[c]);
    const nothingToBuild = !creds.length && !p.onTheJob.length && !p.toTrain.length;
    pathBox.replaceChildren(h("ol", { class: "path" },
      step(`Short term · ${HORIZONS.earn.span}`, p.first ? p.first.role.title : "No close first job yet",
        p.first
          ? h("p", {}, `Gets you earning: ${payRange(p.first.role)} (estimate). ${timeLabel(p.first)} to a first paycheck.`)
          : h("p", {}, "None of the Earn now roles fit your answers yet. Adding skills or adjusting your limits may open some up.")),
      step(`Long-term skill building · ${timeLabel(p.dream).toLowerCase()}`, nothingToBuild ? "Mostly experience" : "What to build",
        nothingToBuild ? h("p", {}, "You already have the listed skills and credentials. Build time in the role and show results.") : null,
        p.onTheJob.length ? h("p", {}, h("strong", {}, "Pick up on the job: "), skillNames(p.onTheJob)) : null,
        p.toTrain.length ? h("p", {}, h("strong", {}, "Train separately: "), skillNames(p.toTrain)) : null,
        creds.length ? h("div", {}, h("strong", {}, "Earn:"), h("ul", {}, creds.map((c) => h("li", {}, `${c.name}. Estimated cost: ${c.cost}`)))) : null),
      step(`Dream job · ${HORIZONS[p.dream.horizon].span}`, p.dream.role.title,
        h("p", {}, `${payRange(p.dream.role)} (estimate). ${pathways[p.dream.role.id].blurb}`),
        h("button", { class: "secondary", onclick: () => { state.selected = p.dream.role.id; ctx.next(); } }, "See gaps & this week's action"))));
  }

  // ---- Compare ----
  const compareBox = h("div", { class: "compare", "aria-live": "polite" });
  const compareButtons = new Map();
  function toggleCompare(id) {
    const had = state.compare.includes(id);
    state.compare = had ? state.compare.filter((x) => x !== id) : [...state.compare, id].slice(-2);
    paintCompare();
    compareButtons.forEach((b, k) => setCompareButton(b, k));
    if (!had && state.compare.length === 2) compareBox.scrollIntoView({ block: "nearest" });
  }
  const setCompareButton = (b, id) => {
    const on = state.compare.includes(id);
    b.textContent = on ? "✓ Comparing" : "Compare this path";
    b.setAttribute("aria-pressed", String(on));
  };
  function paintCompare() {
    const ss = state.compare.map(scoreOf);
    if (!ss.length) return compareBox.replaceChildren();
    if (ss.length === 1) {
      return compareBox.replaceChildren(h("p", { class: "compare-hint" }, `Comparing ${ss[0].role.title}. Choose one more role, from any ring.`,
        h("button", { class: "linklike", onclick: () => toggleCompare(ss[0].role.id) }, "Clear")));
    }
    const row = (label, fn) => h("tr", {}, h("th", { scope: "row" }, label), ss.map((s) => h("td", {}, fn(s))));
    compareBox.replaceChildren(
      h("div", { class: "compare-head" }, h("h3", {}, "Compare two paths"),
        h("button", { class: "linklike", onclick: () => { state.compare = []; paintCompare(); compareButtons.forEach(setCompareButton); } }, "Clear")),
      h("div", { class: "table-scroll" }, h("table", { class: "compare-table" },
        h("thead", {}, h("tr", {}, h("td", {}), ss.map((s) => h("th", { scope: "col" }, s.role.title)))),
        h("tbody", {},
          row("Ring", (s) => `${HORIZONS[s.horizon].label} (${HORIZONS[s.horizon].span})`),
          row("Time to reach this role", timeLabel),
          row("Estimated pay", (s) => payRange(s.role)),
          row("Schedule", (s) => SCHEDULE[s.role.hours][0]),
          row("Work style", (s) => pathways[s.role.id].mode),
          row("Credentials to earn", (s) => s.missing.map((c) => `${credentials[c].name}. Estimated cost: ${credentials[c].cost}`).join("; ") || "None"),
          row("Skills you already have", (s) => `${s.matchedSkills.length} of ${s.role.skills.length}`),
          row("Skills to build", (s) => skillNames(s.role.skills.filter((t) => !s.matchedSkills.includes(t))) || "None"),
          row("Match", (s) => pct(s.total))))));
  }

  // ---- Role cards ----
  const panel = h("div", { class: "opp-panel" });
  function roleCard(s) {
    const path = pathways[s.role.id];
    const [schedule, schedClass] = SCHEDULE[s.role.hours];
    const compareBtn = h("button", { class: "secondary strong", onclick: () => toggleCompare(s.role.id) });
    const dreamBtn = h("button", { class: "secondary", onclick: () => setDream(s.role.id) });
    compareButtons.set(s.role.id, compareBtn); setCompareButton(compareBtn, s.role.id);
    dreamButtons.set(s.role.id, dreamBtn); setDreamButton(dreamBtn, s.role.id);
    const missing = s.missing.map((c) => credentials[c].name);
    return h("li", { class: "opp-card" },
      h("div", { class: "opp-card-head" }, h("h4", {}, s.role.title),
        h("div", { class: "opp-tags" }, h("span", { class: `tag ${MODE_CLASS[path.mode]}` }, path.mode), h("span", { class: `tag ${schedClass}` }, schedule))),
      h("p", { class: "opp-meta" }, `${payRange(s.role)} (estimate) · ${timeLabel(s)} · ${pct(s.total)} match`),
      h("p", {}, path.blurb),
      s.matchedSkills.length ? h("p", { class: "opp-bring" }, h("strong", {}, "You bring: "), skillNames(s.matchedSkills)) : null,
      h("p", { class: "opp-how" }, h("strong", {}, "How to get there: "), path.how),
      s.blocked.length ? h("p", { class: "opp-warn" }, `Doesn't fully fit your limits: ${s.blocked.join(", ").toLowerCase()}. Check each opening.`) : null,
      h("div", { class: "opp-actions" }, compareBtn, dreamBtn,
        h("button", { class: "secondary", onclick: () => { state.selected = s.role.id; ctx.next(); } }, "See gaps")),
      h("details", { class: "opp-why" }, h("summary", {}, "Why this match?"),
        missing.length ? h("p", {}, `Missing: ${missing.join("; ")}.`) : h("p", {}, "No credentials missing."),
        h("table", { class: "score" },
          h("tr", {}, h("th", {}, "Part"), h("th", {}, "Score"), h("th", {}, "Weight")),
          h("tr", {}, h("td", {}, `Skills match (${s.matchedSkills.length} of ${s.role.skills.length} skills)`), h("td", {}, pct(s.skills)), h("td", {}, pct(WEIGHTS.skills))),
          h("tr", {}, h("td", {}, "Constraint match"), h("td", {}, pct(s.constraints)), h("td", {}, pct(WEIGHTS.constraints))),
          h("tr", {}, h("td", {}, "Interest match"), h("td", {}, pct(s.interests)), h("td", {}, pct(WEIGHTS.interests)))),
        h("ul", { class: "checks" }, s.checks.map((c) => h("li", { class: c.pass ? "ok" : "no" }, `${c.pass ? "✓" : "✗"} ${c.label}: ${c.detail}`)))));
  }

  function pickRing(k) {
    state.horizon = k;
    for (const key of HORIZON_ORDER) {
      const on = key === k;
      pills[key].classList.toggle("selected", on);
      pills[key].setAttribute("aria-pressed", String(on));
      circles[key].classList.toggle("selected", on);
    }
    compareButtons.clear();
    dreamButtons.clear();
    const list = groups[k];
    panel.replaceChildren(
      h("p", { class: "eyebrow" }, HORIZONS[k].span),
      h("h3", {}, HORIZONS[k].heading),
      h("p", { class: "opp-lead" }, leads[k]),
      list.length ? h("ul", { class: "opp-cards" }, list.map(roleCard))
        : h("p", {}, "No roles here fit your answers yet. Adding skills or adjusting your limits may open some up."));
  }

  pickRing(state.horizon);
  paintPath();
  paintMarkers();
  paintCompare();

  return h("section", { class: "opp" },
    h("h2", {}, "Start small, then grow outward"),
    h("p", { class: "opp-intro" }, `The inner circle is work that gets you earning ${by}. Each ring out takes more training and pays off further down the road. Tap a ring, then compare any two roles.`),
    chart,
    h("p", { class: "legend" }, "Inner: earn now · Middle: short training · Outer: big moves"),
    h("div", { class: "path-box" },
      h("h3", {}, "Map out your path"),
      h("label", { for: "dream-job" }, "Your dream job"), dreamSelect,
      pathBox),
    panel,
    compareBox,
    h("p", { class: "rule" }, `Match = ${pct(WEIGHTS.skills)} skills + ${pct(WEIGHTS.constraints)} constraints (hours, distance, timing, pay) + ${pct(WEIGHTS.interests)} interests. Each ring shows up to eight of your best matches. Pay and time ranges are illustrative estimates.`),
    h("div", { class: "nav" }, h("button", { onclick: ctx.next }, "See gaps & this week's action")));
}
