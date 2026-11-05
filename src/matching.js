import { careers } from "./data/careers.js";
import { credentials } from "./data/credentials.js";

// The scoring rule is shown to the user, so keep it in one place.
export const WEIGHTS = { skills: 0.5, constraints: 0.3, interests: 0.2 };
export const RINGS = {
  strong: { label: "Strong fit", rule: "You meet every credential requirement and score 60% or higher." },
  stretch: { label: "Stretch", rule: "You are missing one or two credentials (named below), or score 45% or higher." },
  reach: { label: "Reach", rule: "Outside your usual lane or a longer path, but your skills and interests still point toward it." }
};
const MAX_PER_RING = 5;
const ORDER = ["strong", "stretch", "reach"];

const freeTextRules = [
  [/trade|hands|repair|build|fix|mechanic/i, "mechanical"], [/electric|power/i, "electrical"],
  [/computer|\bit\b|tech\b|software/i, "tech"], [/people|help|care|teach/i, "people"],
  [/outdoor/i, "outdoors"], [/lead|manage|supervis/i, "leading"], [/safety|secur|police/i, "security"],
  [/data|analy/i, "data"], [/truck|driv|warehouse|logistic/i, "logistics"]
];

// "What are you looking for?" -> extra interest tags and a days-only hint.
export function freeTextSignals(text = "") {
  const interests = [...new Set(freeTextRules.filter(([re]) => re.test(text)).map(([, t]) => t))];
  const daysOnly = /daytime|days only|no nights|no night|9.?to.?5|weekdays/i.test(text);
  const notes = [...interests.map((t) => `interest: ${t}`), daysOnly && "daytime hours only"].filter(Boolean);
  return { interests, daysOnly, notes };
}

export function weeksUntil(dateStr, today = new Date()) {
  const t = new Date(dateStr);
  if (isNaN(t)) return 12;
  return Math.max(1, Math.round((t - today) / (7 * 24 * 3600 * 1000)));
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const money = (n) => `$${Math.round(n).toLocaleString()}`;

export function scoreRole(role, profile, today = new Date()) {
  const q = profile.answers;
  const sig = freeTextSignals(q.freeText);
  const have = new Set(profile.skills);
  const held = new Set(profile.credentials);

  const matchedSkills = role.skills.filter((s) => have.has(s));
  const skills = matchedSkills.length / role.skills.length;
  const missing = role.requires.filter((c) => !held.has(c));
  const maxWeeks = Math.max(0, ...missing.map((c) => credentials[c].weeks));

  const needDays = q.daysOnly || q.childcare || sig.daysOnly;
  const hourlyLo = role.pay.lo / 2080;
  const hourlyHi = role.pay.hi / 2080;
  const available = weeksUntil(q.incomeBy, today);
  const weeks = role.baseWeeks + maxWeeks;
  const eduLimit = { none: 0, short: 12, long: 104 }[q.education] ?? 12;

  const hoursOk = !needDays || role.hours === "days";
  const commuteOk = role.commute <= q.commuteMiles;
  const payOk = hourlyLo >= q.minPay;
  const checks = [
    { key: "hours", label: "Hours", hard: true, pass: hoursOk, score: hoursOk ? 1 : role.hours === "mixed" ? 0.4 : 0,
      detail: `${role.hours === "days" ? "Daytime" : role.hours === "mixed" ? "Mostly days, some on-call" : "Nights / rotating shifts"}${needDays ? " (you need days only)" : ""}` },
    { key: "distance", label: "Distance", pass: commuteOk,
      score: commuteOk || q.relocate === "yes" ? 1 : Math.max(0, q.commuteMiles / role.commute),
      detail: `Employers about ${role.commute} mi away (your limit: ${q.commuteMiles} mi)` },
    { key: "timing", label: "Income timing", pass: weeks <= available, score: Math.min(1, available / weeks),
      detail: `About ${weeks} weeks to first paycheck; you need income in ~${available} weeks` },
    { key: "pay", label: "Pay", hard: true, pass: payOk, score: payOk ? 1 : hourlyHi >= q.minPay ? 0.6 : 0.2,
      detail: `${money(role.pay.lo)}–${money(role.pay.hi)}/yr (~$${hourlyLo.toFixed(0)}–$${hourlyHi.toFixed(0)}/hr); your minimum is $${q.minPay}/hr` }
  ];
  if (q.wantsPaidTraining) {
    const ok = missing.length === 0 || role.paidTraining;
    checks.push({ key: "training", label: "Paid training", pass: ok, score: ok ? 1 : 0.3,
      detail: ok ? (missing.length ? "Employers or apprenticeships pay while you train" : "No training needed to start") : "You would pay for training yourself" });
  }
  const eduOk = maxWeeks <= eduLimit;
  checks.push({ key: "education", label: "Classes", pass: eduOk, score: eduOk ? 1 : 0.4,
    detail: missing.length ? `Longest credential takes ~${maxWeeks} weeks (you are open to ${q.education === "none" ? "no classes" : q.education === "short" ? "short courses" : "longer programs"})` : "No classes needed" });
  const constraints = avg(checks.map((c) => c.score));

  const wanted = new Set([...q.interests, ...sig.interests]);
  const overlap = role.interests.filter((t) => wanted.has(t)).length / (role.interests.length || 1);
  const style = avg([
    q.handsOn === "either" || q.handsOn === (role.handsOn ? "hands-on" : "desk") ? 1 : 0.2,
    q.setting === "either" || role.setting === "either" || q.setting === role.setting ? 1 : 0.2,
    q.social === "either" || role.team === "either" || q.social === role.team ? 1 : 0.2
  ]);
  const interests = 0.7 * overlap + 0.3 * style;

  const total = WEIGHTS.skills * skills + WEIGHTS.constraints * constraints + WEIGHTS.interests * interests;

  let ring = null;
  if (missing.length === 0 && total >= 0.6) ring = "strong";
  else if (missing.length <= 2 && total >= 0.45) ring = "stretch";
  else if (total >= 0.3) ring = "reach";
  const blocked = checks.filter((c) => c.hard && !c.pass).map((c) => c.label);
  if (ring && blocked.length && ring !== "reach") ring = ORDER[ORDER.indexOf(ring) + 1];

  return { role, ring, total, skills, constraints, interests, matchedSkills, missing, checks, blocked, weeks };
}

export function rankRoles(profile, today = new Date()) {
  const scored = careers.map((r) => scoreRole(r, profile, today)).filter((s) => s.ring);
  const rings = { strong: [], stretch: [], reach: [] };
  for (const s of scored) rings[s.ring].push(s);
  for (const k of ORDER) rings[k] = rings[k].sort((a, b) => b.total - a.total).slice(0, MAX_PER_RING);
  const top = rings.strong[0] || rings.stretch[0] || rings.reach[0] || null;
  return { rings, top };
}

// One action sized for under two hours, for the chosen role.
export function weeklyAction(result) {
  if (!result) return null;
  const first = result.missing[0];
  if (first) return { text: credentials[first].firstStep, why: `${credentials[first].name} is the first gap for ${result.role.title}.` };
  return { text: `Update your resume with two translated skill lines, then apply to 3 ${result.role.title} postings (about 90 min).`,
    why: `You already meet the requirements for ${result.role.title}.` };
}
