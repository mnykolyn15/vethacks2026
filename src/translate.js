import { credentialKeywords } from "./data/credentials.js";
import { codes, lookupCode, billetInfo, isLeadershipGrade } from "./data/military.js";

export const skillLabels = {
  mechanical: "Mechanical repair", electrical: "Electrical systems", diagnostics: "Troubleshooting & diagnostics",
  supervision: "Team supervision", safety: "Safety & compliance", maintenance: "Preventive maintenance",
  logistics: "Inventory & logistics", documentation: "Records & documentation", it: "IT & networking",
  driving: "Vehicle operation", patientcare: "Patient care", analysis: "Data analysis",
  customer: "Customer service", construction: "Construction & installation", security: "Security & enforcement",
  projectmgmt: "Project coordination", training: "Training & instruction"
};

// Duty text -> civilian skill. `phrase(n)` opens the resume line; `n` is a number found in the duty (e.g. "Led 4 repairers").
const rules = [
  { tag: "supervision", re: /\bled\b|supervis|team lead|squad|section|\bnco\b|managed (?:a )?team/i, phrase: (n) => n ? `Supervised a team of ${n}` : "Supervised a team" },
  { tag: "diagnostics", re: /troubleshoo?t|diagnos|fault|isolat(?:ed|ing) (?:failures|problems)/i, phrase: () => "Diagnosed and resolved equipment faults" },
  { tag: "mechanical", re: /generator|engine|mechanic|repair|overhaul|hydraulic|power plant/i, phrase: () => "Repaired and maintained mechanical equipment" },
  { tag: "electrical", re: /electri|wir(?:ed|ing)|circuit|voltage|power distribution/i, phrase: () => "Installed and tested electrical systems" },
  { tag: "maintenance", re: /preventive|pmcs|scheduled maintenance|inspect/i, phrase: (n) => n ? `Performed scheduled preventive maintenance on ${n}+ units` : "Performed scheduled preventive maintenance" },
  { tag: "safety", re: /safety|hazard|osha|risk assess|compliance/i, phrase: () => "Enforced safety procedures and completed hazard assessments" },
  { tag: "logistics", re: /inventory|supply|accountab|tool|equipment valued|distribution/i, phrase: () => "Managed inventory and equipment accountability" },
  { tag: "documentation", re: /record|log\b|logs\b|paperwork|da form|report|document/i, phrase: () => "Maintained accurate records and reports" },
  { tag: "it", re: /network|computer|server|cyber|\bit\b|help ?desk/i, phrase: () => "Configured and supported IT systems" },
  { tag: "driving", re: /convoy|drove|driv(?:e|ing)|truck|vehicle operat/i, phrase: () => "Operated heavy vehicles safely" },
  { tag: "patientcare", re: /medic|patient|triage|first aid|casualt/i, phrase: () => "Provided emergency patient care" },
  { tag: "analysis", re: /analy[sz]|intelligence|data/i, phrase: () => "Analyzed data and produced actionable reports" },
  { tag: "training", re: /train(?:ed|ing)? (?:soldiers|personnel|staff)|instruct|mentor|taught|warrior leader/i, phrase: () => "Trained and mentored personnel" },
  { tag: "construction", re: /install|construct|build|fabricat|demolition|weld/i, phrase: () => "Installed and built field infrastructure" },
  { tag: "security", re: /guard|security|patrol|police|investigat/i, phrase: () => "Enforced security and responded to incidents" },
  { tag: "projectmgmt", re: /plan(?:ned|ning)|coordinat|schedul|project/i, phrase: () => "Planned and coordinated work" },
  { tag: "customer", re: /customer|brief(?:ed|ing)|liaison|counsel|advis/i, phrase: () => "Briefed and advised stakeholders" }
];

// Typical duties and titles per code (see data/military.js), used ONLY when the record has no tasks or billets.
export const mosDuties = Object.fromEntries(codes.map((c) => [c.code, c.duties]));
export const mosTitles = Object.fromEntries(codes.map((c) => [c.code, c.title]));

// Everyday words people use when adding a skill themselves, beyond the record-oriented rules above.
const addedSkillRules = [
  [/leader|manag|foreman/i, "supervision"], [/customer|sales|client/i, "customer"], [/excel|spreadsheet|sql|tableau/i, "analysis"],
  [/hvac|plumb|carpent|machin/i, "mechanical"], [/python|software|program|tech support|comput/i, "it"],
  [/teach|coach|onboard/i, "training"], [/budget|planning|scheduling/i, "projectmgmt"], [/shipping|warehouse|logistic/i, "logistics"],
  [/electric/i, "electrical"], [/cpr|nurs|emt/i, "patientcare"]
];

// Skill tags a user-added skill counts toward. Empty means it shows on the resume but can't change matches.
export function tagsForSkill(text) {
  const tags = [...rules.filter((r) => r.re.test(text)).map((r) => r.tag),
    ...addedSkillRules.filter(([re]) => re.test(text)).map(([, t]) => t)];
  return [...new Set(tags)];
}

const clean = (s) => s.replace(/^[•\-*·▪◦\s]+/, "").replace(/[.;\s]+$/, "");
const number = (s) => (s.match(/\b(\d{1,4})\b/) || [])[1];

// Turn a confirmed record into civilian skills with evidence + a copy-ready resume line each.
export function translate(jst) {
  const sources = [];
  for (const job of jst.jobs) {
    const from = job.title || job.code;
    const typical = lookupCode(job.code)?.duties || [];
    const tasks = (job.duties || []).filter(Boolean);
    const held = (job.billets || []).filter(Boolean);
    // Billets say what position someone held; use what that position typically involves as evidence.
    for (const b of held) sources.push({ text: billetInfo(b)?.does || `Served as ${b}`, from: `Billet: ${b}`, inferred: false });
    tasks.forEach((d) => sources.push({ text: d, from, inferred: false }));
    if (isLeadershipGrade(job.grade)) sources.push({ text: `Held a leadership grade (${job.grade}), responsible for supervising others`, from: "Pay grade", inferred: true });
    if (!tasks.length && !held.length) {
      // No tasks or billets: use typical tasks if we have them, otherwise the code's title and the civilian jobs it lines up with.
      const fallback = typical.length ? typical : [job.title, ...(job.civilian || [])].filter(Boolean);
      for (const d of fallback) sources.push({ text: d, from, inferred: true });
    }
  }
  for (const c of jst.courses) sources.push({ text: c.name, from: "Course", inferred: false });

  const found = new Map();
  for (const src of sources) {
    for (const rule of rules) {
      if (!rule.re.test(src.text) || found.has(rule.tag)) continue;
      const evidence = clean(src.text);
      found.set(rule.tag, {
        tag: rule.tag, label: skillLabels[rule.tag], evidence, from: src.from, inferred: src.inferred,
        line: `${rule.phrase(number(src.text))} (${evidence.charAt(0).toLowerCase()}${evidence.slice(1)}).`
      });
    }
  }
  return [...found.values()];
}

export function heldCredentials(jst, extraSkills = []) {
  const text = [...jst.certs, ...jst.courses.map((c) => c.name), ...extraSkills].join("\n");
  return Object.keys(credentialKeywords).filter((id) => credentialKeywords[id].test(text));
}
