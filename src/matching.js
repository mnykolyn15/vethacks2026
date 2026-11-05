import { careers } from "./data/careers.js";
import { credentials } from "./data/credentials.js";
import { pathways } from "./data/pathways.js";
import { skillLabels } from "./translate.js";

// The scoring rule is shown to the user, so keep it in one place.
export const WEIGHTS = { skills: 0.5, constraints: 0.3, interests: 0.2 };
// Your target rings, inner to outer. `maxMonths` decides which ring a role lands in.
export const HORIZONS = {
  earn: { label: "Earn now", span: "0–3 months", maxMonths: 3, heading: "Roles that build directly on your record" },
  train: { label: "Grow", span: "3–12 months", maxMonths: 12, heading: "Roles a short credential can unlock" },
  big: { label: "Dream", span: "1–4 years", maxMonths: Infinity, heading: "Longer paths that pay off down the road" }
};
export const HORIZON_ORDER = ["earn", "train", "big"];
const MAX_PER_RING = 8;
const ORDER = ["strong", "stretch", "reach"];
const WEEKS_PER_MONTH = 4.33;

// ---- Answer helpers ----
export const IMPORTANCE = { strong: 3, medium: 2, low: 1 };
const weightOf = (q, key) => IMPORTANCE[q.importance?.[key]] ?? IMPORTANCE.medium;

// What each questionnaire choice says about the person's interests (tags match careers.js `interests`).
const WORK_TAGS = {
  physical: ["mechanical", "electrical"], build: ["mechanical", "electrical", "outdoors"], technical: ["tech", "data"],
  planning: ["logistics", "leading"], teaching: ["people", "leading"], customer: ["people"]
};
const MOMENT_TAGS = {
  puzzle: ["mechanical", "electrical", "tech", "data"], pressure: ["mechanical", "electrical", "security", "medical"],
  result: ["mechanical", "electrical", "outdoors"], teaching: ["people", "leading"], people: ["people", "leading", "medical"],
  operation: ["logistics", "leading"], trusted: ["leading", "security"], learning: [], exact: ["data", "mechanical"],
  bigger: ["security", "people", "medical"], easier: ["people", "medical"]
};
const HANDS_ON = new Set(["physical", "build"]);
// Roles where the work happens at changing sites (driving to jobs) rather than one place every day.
const MOBILE = new Set(["gen_tech", "hvac_tech", "solar_tech", "industrial_electrician", "elevator", "wind_tech", "cdl_driver", "heavy_equip", "emt", "police"]);
// Roles paid a yearly salary; the rest are compared on an hourly rate.
const SALARIED = new Set(["project_coord", "safety_coord", "maint_supervisor", "maint_planner", "facilities_manager", "hr_generalist", "data_analyst", "network_admin", "police"]);

// How a role feels day to day: derived from its hours, skills, and interests.
function rolePace(role) {
  const pace = new Set();
  if (role.hours === "days" && role.skills.some((t) => ["maintenance", "documentation"].includes(t))) pace.add("routine");
  if (role.skills.includes("diagnostics")) pace.add("problems");
  if (role.hours !== "days" || role.interests.some((t) => ["medical", "security"].includes(t))) pace.add("pressure");
  if (role.skills.some((t) => ["projectmgmt", "construction"].includes(t))) pace.add("project");
  return pace;
}

const freeTextRules = [
  [/trade|hands|repair|build|fix|mechanic/i, "mechanical"], [/electric|power/i, "electrical"],
  [/computer|\bit\b|tech\b|software/i, "tech"], [/people|help|care|teach/i, "people"],
  [/outdoor/i, "outdoors"], [/lead|manage|supervis/i, "leading"], [/safety|secur|police/i, "security"],
  [/data|analy/i, "data"], [/truck|driv|warehouse|logistic/i, "logistics"]
];

// "Anything else?" -> extra interest tags and a days-only hint.
export function freeTextSignals(text = "") {
  const interests = [...new Set(freeTextRules.filter(([re]) => re.test(text)).map(([, t]) => t))];
  const daysOnly = /daytime|days only|no nights|no night|9.?to.?5|weekdays/i.test(text);
  const notes = [...interests.map((t) => `interest: ${t}`), daysOnly && "daytime hours only"].filter(Boolean);
  return { interests, daysOnly, notes };
}

// Daytime only = chose "Daytime only" and didn't say evenings, nights, or rotating shifts are fine (or said so in their own words).
export function daytimeOnly(q) {
  const h = q.hours || [];
  return (h.includes("days") && !h.includes("evenings") && !h.includes("rotating")) || freeTextSignals(q.freeText).daysOnly;
}

export function weeksUntil(dateStr, today = new Date()) {
  const t = new Date(dateStr);
  if (isNaN(t)) return 12;
  return Math.max(1, Math.round((t - today) / (7 * 24 * 3600 * 1000)));
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const wavg = (items) => items.reduce((a, [v, w]) => a + v * w, 0) / (items.reduce((a, [, w]) => a + w, 0) || 1);
const money = (n) => `$${Math.round(n).toLocaleString()}`;
const NEUTRAL = 1; // an unanswered question never counts against a role

// Share of the role's interest tags the person has shown interest in.
function overlap(role, tagCounts) {
  if (!role.interests.length) return NEUTRAL;
  return role.interests.reduce((sum, t) => sum + Math.min(1, (tagCounts.get(t) || 0) / 2), 0) / role.interests.length;
}

export function scoreRole(role, profile, today = new Date()) {
  const q = profile.answers;
  const sig = freeTextSignals(q.freeText);
  const have = new Set(profile.skills);
  const held = new Set(profile.credentials);

  const matchedSkills = role.skills.filter((s) => have.has(s));
  const skills = matchedSkills.length / role.skills.length;
  const missing = role.requires.filter((c) => !held.has(c));
  const maxWeeks = Math.max(0, ...missing.map((c) => credentials[c].weeks));

  const days = daytimeOnly(q);
  const nights = (q.hours || []).includes("evenings") || (q.hours || []).includes("rotating");
  const salaried = SALARIED.has(role.id);
  const lo = salaried ? role.pay.lo : role.pay.lo / 2080;
  const hi = salaried ? role.pay.hi : role.pay.hi / 2080;
  const need = Number(salaried ? q.minSalary : q.minHourly) || 0;
  const unit = salaried ? "/yr salary" : "/hr";
  const fmt = (n) => (salaried ? money(n) : `$${n.toFixed(0)}`);
  const available = weeksUntil(q.incomeBy, today);
  const weeks = role.baseWeeks + maxWeeks;
  const eduLimit = { none: 0, short: 12, long: 104, any: 104 }[q.education] ?? 12;
  const eduName = { none: "no classes", short: "short courses", long: "longer programs", any: "any amount of training" }[q.education] || "short courses";

  // Each check carries the importance of the question it came from. "Strong" checks are deal-breakers.
  const hoursOk = !days || role.hours === "days";
  const shiftsOk = role.hours !== "shifts" || nights || !(q.hours || []).length;
  const hoursPass = hoursOk && shiftsOk;
  const timingImportance = q.needsHelp === "yes" ? "strong" : q.importance?.timing;
  const flexMiles = Number(q.commuteFlex) || 0;
  const commuteOk = role.commute <= q.commuteMiles;
  const withinFlex = !commuteOk && role.commute <= q.commuteMiles + flexMiles;
  // Pay ranges are estimates, so a role only fails on pay if even the top of its range is under the minimum.
  // A role that starts under the minimum but can reach it passes, with a note shown in Compare.
  const payOk = hi >= need;
  const startsLow = payOk && lo < need;
  const checks = [
    { key: "hours", label: "Hours", pass: hoursPass, weight: weightOf(q, "hours"), strong: q.importance?.hours === "strong",
      score: hoursPass ? 1 : role.hours === "mixed" ? 0.4 : 0,
      detail: `${role.hours === "days" ? "Daytime" : role.hours === "mixed" ? "Mostly days, some on-call" : "Nights / rotating shifts"}${days ? " (you want days only)" : ""}` },
    { key: "distance", label: "Distance", pass: commuteOk || withinFlex, weight: weightOf(q, "commute"), strong: q.importance?.commute === "strong",
      score: commuteOk || q.relocate === "yes" ? 1 : withinFlex ? 0.85 : Math.max(0, q.commuteMiles / role.commute),
      detail: `Employers about ${role.commute} mi away (your limit: ${q.commuteMiles} mi${flexMiles ? `, up to ${flexMiles} more for a better job` : ""})` },
    { key: "timing", label: "Income timing", pass: weeks <= available, weight: IMPORTANCE[timingImportance] ?? 2, strong: timingImportance === "strong",
      score: Math.min(1, available / weeks),
      detail: `About ${weeks} weeks to first paycheck; you need income in ~${available} weeks` },
    { key: "pay", label: "Pay", pass: payOk, weight: weightOf(q, "pay"), strong: q.importance?.pay === "strong",
      score: startsLow ? 0.6 : payOk ? 1 : 0.2,
      note: startsLow ? `Pay: can start around ${fmt(lo)}${unit}, under your ${fmt(need)}${unit} minimum, and reach about ${fmt(hi)}${unit} (estimate)` : null,
      detail: `${money(role.pay.lo)}–${money(role.pay.hi)}/yr (${salaried ? "salaried" : `about $${(role.pay.lo / 2080).toFixed(0)}–$${(role.pay.hi / 2080).toFixed(0)}/hr`}); your minimum is ${need ? fmt(need) : "not set"}${need ? unit : ""}` }
  ];
  const eduOk = maxWeeks <= eduLimit;
  checks.push({ key: "education", label: "Classes", pass: eduOk, weight: weightOf(q, "education"), strong: q.importance?.education === "strong", score: eduOk ? 1 : 0.4,
    detail: missing.length ? `Longest credential takes ~${maxWeeks} weeks (you are open to ${eduName})` : "No classes needed" });
  const constraints = wavg(checks.map((c) => [c.score, c.weight]));

  // Interests: five questions, each weighted by how much it matters to the person.
  const tags = new Map();
  const bump = (list) => list.forEach((t) => tags.set(t, (tags.get(t) || 0) + 1));
  (q.workTypes || []).forEach((k) => bump(WORK_TAGS[k] || []));
  sig.interests.forEach((t) => bump([t]));
  const momentTags = new Map();
  (q.moments || []).forEach((k) => (MOMENT_TAGS[k] || []).forEach((t) => momentTags.set(t, (momentTags.get(t) || 0) + 1)));

  const picked = q.workTypes || [];
  const wantsHands = picked.some((k) => HANDS_ON.has(k));
  const wantsDesk = picked.some((k) => !HANDS_ON.has(k));
  const handsFit = !picked.length || (wantsHands && wantsDesk) || (wantsHands === role.handsOn) ? NEUTRAL : 0.3;
  const workFit = picked.length || sig.interests.length ? 0.7 * overlap(role, tags) + 0.3 * handsFit : NEUTRAL;
  const momentFit = (q.moments || []).length ? overlap(role, momentTags) : NEUTRAL;

  const where = (q.where || []).filter((w) => w !== "none");
  const siteWants = where.filter((w) => w === "same" || w === "different");
  const settingWants = where.filter((w) => ["indoors", "outdoors", "office"].includes(w));
  const mobile = MOBILE.has(role.id);
  const siteOk = !siteWants.length || siteWants.includes(mobile ? "different" : "same");
  const settingOk = !settingWants.length || settingWants.some((w) =>
    (w === "indoors" && role.setting !== "outdoors") || (w === "outdoors" && role.setting !== "indoors") || (w === "office" && role.setting === "indoors" && !role.handsOn));
  const whereFit = avg([siteOk ? 1 : 0.3, settingOk ? 1 : 0.3]);

  const ppl = (q.people || []).filter((p) => p !== "mix");
  const peopleOk = !ppl.length || (q.people || []).includes("mix") || ppl.some((p) =>
    (p === "alone" && role.team !== "team") || (p === "crew" && role.team !== "solo") ||
    (p === "lead" && (role.interests.includes("leading") || role.skills.includes("supervision"))) ||
    (p === "customers" && (role.skills.includes("customer") || role.interests.includes("people"))));
  const peopleFit = peopleOk ? 1 : 0.3;

  const pace = rolePace(role);
  const paceFit = !(q.pace || []).length || q.pace.some((p) => pace.has(p)) ? 1 : 0.4;

  const interests = wavg([[workFit, weightOf(q, "work")], [momentFit, weightOf(q, "moments")], [whereFit, weightOf(q, "where")],
    [peopleFit, weightOf(q, "people")], [paceFit, weightOf(q, "pace")]]);

  const total = WEIGHTS.skills * skills + WEIGHTS.constraints * constraints + WEIGHTS.interests * interests;

  let ring = null;
  if (missing.length === 0 && total >= 0.6) ring = "strong";
  else if (missing.length <= 2 && total >= 0.45) ring = "stretch";
  else if (total >= 0.3) ring = "reach";
  const blocked = checks.filter((c) => c.strong && !c.pass).map((c) => c.label);
  if (ring && blocked.length && ring !== "reach") ring = ORDER[ORDER.indexOf(ring) + 1];

  const months = missing.length ? pathways[role.id].months : weeks / WEEKS_PER_MONTH;
  const horizon = HORIZON_ORDER.find((k) => months <= HORIZONS[k].maxMonths);

  return { role, ring, total, skills, constraints, interests, matchedSkills, missing, checks, blocked, weeks, months, horizon };
}

// Apprenticeship roles are paid, structured training that can take years. People choose, on the results,
// whether to see everything ("all"), only those roles ("only"), or none of them ("none").
export const requiresApprenticeship = (role) => role.requires.some((c) => c.endsWith("_apprenticeship"));
const allowed = (role, pref) => pref === "only" ? requiresApprenticeship(role) : pref === "none" ? !requiresApprenticeship(role) : true;

// Every role, grouped by ring. Nothing is ruled out, so low fit never hides a role. `total` only orders them.
// `keep` holds roles the person already chose, which stay visible whatever the apprenticeship setting says.
export function rolesByHorizon(profile, today = new Date(), { apprenticeship = "all", keep = [] } = {}) {
  const out = { earn: [], train: [], big: [] };
  for (const r of careers) {
    if (allowed(r, apprenticeship) || keep.includes(r.id)) { const s = scoreRole(r, profile, today); out[s.horizon].push(s); }
  }
  for (const k of HORIZON_ORDER) out[k].sort((a, b) => b.total - a.total);
  return out;
}

// Limits this role really fails, in words: only ones the person marked as Strong.
export function limitProblems(s) {
  return s.checks.filter((c) => c.strong && !c.pass).map((c) => `${c.label.toLowerCase()}: ${c.detail}.`);
}

export function rankRoles(profile, today = new Date(), { apprenticeship = "all" } = {}) {
  const scored = careers.filter((r) => allowed(r, apprenticeship)).map((r) => scoreRole(r, profile, today)).filter((s) => s.ring);
  const rings = { strong: [], stretch: [], reach: [] };
  for (const s of scored) rings[s.ring].push(s);
  for (const k of ORDER) rings[k] = rings[k].sort((a, b) => b.total - a.total).slice(0, MAX_PER_RING);
  const top = rings.strong[0] || rings.stretch[0] || rings.reach[0] || null;
  return { rings, top };
}

// A plan B for the weekly action: another role that could pay soon, plus in-person help if money is tight.
function backupPlan(result, profile, today) {
  const others = careers.map((c) => scoreRole(c, profile, today))
    .filter((s) => s.ring && s.horizon === "earn" && !s.blocked.length && s.role.id !== result.role.id)
    .sort((a, b) => b.total - a.total);
  const alt = others[0];
  const lateForIncome = result.checks.some((c) => c.key === "timing" && !c.pass);
  return [
    alt ? `If this stalls, apply to ${alt.role.title} roles, which could start paying in about ${alt.weeks} weeks.` : "If this stalls, ask an American Job Center which local roles fit your limits.",
    lateForIncome ? "This path may run past the date you need income, so ask an American Job Center about short-term options now." : ""
  ].filter(Boolean).join(" ");
}

// One action sized for under two hours, for the chosen role, with a deadline and a plan B.
export function weeklyAction(result, profile, today = new Date()) {
  if (!result) return null;
  const deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const backup = backupPlan(result, profile, today);
  const first = result.missing[0];
  if (first) return { text: credentials[first].firstStep, why: `${credentials[first].name} is the first gap for ${result.role.title}.`, deadline, backup };
  return { text: `Update your resume with two translated skill lines, then apply to 3 ${result.role.title} postings (about 90 min).`,
    why: `You already meet the requirements for ${result.role.title}.`, deadline, backup };
}

// Plain-language summary for comparing roles: what works for this person and what doesn't.
export function fitSummary(s) {
  const skillGaps = s.role.skills.filter((t) => !s.matchedSkills.includes(t));
  return {
    fits: [
      ...(s.matchedSkills.length ? [`Already have ${s.matchedSkills.length} of ${s.role.skills.length} skills`] : []),
      ...s.checks.filter((c) => c.pass && !c.note).map((c) => `${c.label}: ${c.detail}`)
    ],
    risks: [
      ...s.checks.filter((c) => !c.pass).map((c) => `${c.label}: ${c.detail}`),
      ...s.checks.filter((c) => c.note).map((c) => c.note),
      ...s.missing.map((id) => `Credential to earn: ${credentials[id].name}. Estimated cost: ${credentials[id].cost}`),
      ...skillGaps.map((t) => `Skill to build: ${skillLabels[t]}`)
    ]
  };
}
