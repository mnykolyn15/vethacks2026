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

// What people did in the service -> the corporate skill it shows -> how to say it on a resume.
// `tag` links a rule to the skills careers.js asks for (null = shown on the resume but doesn't change matches).
// `group` splits the Skills step into business skills and technical skills.
// `say(evidence, n)` is the copy-ready line. [Brackets] mark numbers only the person knows.
const clean = (s) => s.replace(/^[•\-*·▪◦\s]+/, "").replace(/[.;\s]+$/, "");
const number = (s) => (s.match(/\b(\d{1,4})\b/) || [])[1];
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const moneyIn = (s) => (s.match(/\$\s?[\d,.]+\s?[KMB]?/i) || [""])[0].replace(/\s/g, "");
const peopleIn = (s) => (s.match(/\b(\d{1,4})\s+(?:soldiers|personnel|people|marines|airmen|sailors|subordinates|repairers|members)/i) || [])[1];
const levelIn = (s) => {
  const m = s.match(/top secret|ts\/sci|secret|confidential/i)?.[0];
  return m ? (/ts\/sci/i.test(m) ? "TS/SCI" : m.replace(/\b\w/g, (c) => c.toUpperCase())) : "[level]";
};
// Technical skills keep the evidence in the line, since it is the specific thing they did.
const withEvidence = (phrase) => (ev, n) => `${phrase(n)} (${lowerFirst(ev)}).`;

const rules = [
  // ---- Leadership and business skills (the translation table) ----
  { id: "opord", tag: "projectmgmt", group: "business", corporate: "Strategic planning, executive communication",
    re: /opord|operations? order|mission plan|briefed (?:mission|operation|plans?)|commander'?s intent|\bbriefings?\b/i,
    say: () => "Built and presented operational plans to senior leadership." },
  { id: "aar", tag: "projectmgmt", group: "business", corporate: "Continuous improvement, post-mortems",
    re: /after.?action|\baars?\b|lessons learned|debrief/i,
    say: () => "Led structured reviews to find root causes and fix processes." },
  { id: "property", tag: "logistics", group: "business", corporate: "Asset management, audit readiness",
    re: /hand receipt|property book|accountab(?:le|ility)|inventory|sensitive items?|equipment valued|\btools?\b|distribution/i,
    say: (ev) => `Accountable for ${moneyIn(ev) || "[$X]"} in equipment with zero losses.` },
  { id: "counseling", tag: "supervision", group: "business", corporate: "Performance management, coaching",
    re: /counsel|evaluat(?:ed|ing) (?:soldiers|personnel|subordinates|marines|airmen|sailors)|performance review|\bncoers?\b|development plan/i,
    say: (ev) => `Wrote performance reviews and development plans for ${peopleIn(ev) || "[X]"} people.` },
  { id: "roster", tag: "projectmgmt", group: "business", corporate: "Workforce scheduling, resource planning",
    re: /duty roster|watch (?:schedule|bill)|\broster\b|work schedules?|shift schedules?|coverage/i,
    say: () => "Managed coverage schedules for a 24/7 operation." },
  { id: "inspections", tag: "safety", group: "business", corporate: "Quality assurance, compliance",
    re: /inspections?|readiness checks?|quality assurance|\bqa\b|\bqc\b|audit/i,
    say: () => "Ran inspections against strict standards; passed [X] audits." },
  { id: "training", tag: "training", group: "business", corporate: "Onboarding, curriculum design",
    re: /train(?:ed|ing)? (?:new|junior|soldiers|personnel|staff|recruits|marines|airmen|sailors)|onboard|curriculum|instruct|taught|lesson plan|warrior leader|leader course/i,
    say: () => "Designed and delivered training; got new hires mission-ready in [X] weeks." },
  { id: "succession", tag: "supervision", group: "business", corporate: "Succession readiness, ownership",
    re: /took over|assumed (?:command|leadership|duties)|stepped (?:in|up)|acting (?:team|squad|section|platoon|nco)|in the absence/i,
    say: () => "Stepped into leadership roles on short notice." },
  { id: "collab", tag: "customer", group: "business", corporate: "Cross-functional collaboration",
    re: /coordinat(?:ed|ing) with|liaison|\bjoint\b|other units|other branches|cross.?(?:functional|team)/i,
    say: () => "Coordinated across teams with competing priorities." },
  { id: "crosscultural", tag: "customer", group: "business", corporate: "Cross-cultural communication",
    re: /local nationals?|interpreters?|translators?|host.?nation|multinational|cultural/i,
    say: () => "Built working relationships across language and cultural barriers." },
  { id: "risk", tag: "safety", group: "business", corporate: "Risk management",
    re: /risk assess|dd ?2977|\bcrm\b|composite risk|hazard|risk management/i,
    say: () => "Identified hazards and built mitigation plans before execution." },
  { id: "change", tag: null, group: "business", corporate: "Adaptability, change management",
    re: /\bpcs\b|deployments?|deployed|relocat|reorganiz|frequent moves|rapidly changing/i,
    say: () => "Delivered results through frequent relocations and reorganizations." },
  { id: "classified", tag: "security", group: "business", corporate: "Data security, discretion",
    re: /classified|clearance|top secret|ts\/sci|sensitive information|opsec|\bcui\b/i,
    say: (ev) => `Held a ${levelIn(ev)} clearance; trusted with sensitive information.` },
  { id: "procurement", tag: "logistics", group: "business", corporate: "Procurement, vendor and budget management",
    re: /requisition|ordering (?:supplies|parts)|ordered (?:supplies|parts)|procure|purchas|parts? requests?|supply requests?|vendors?/i,
    say: () => "Managed requisitions and kept inventory within budget." },
  { id: "sitrep", tag: "documentation", group: "business", corporate: "Stakeholder reporting",
    re: /sitreps?|status (?:reports?|updates?)|situation reports?|battle update/i,
    say: () => "Kept leadership informed with clear, concise status reports." },
  { id: "pressure", tag: null, group: "business", corporate: "Crisis management, composure",
    re: /little sleep|under pressure|high.?(?:pressure|tempo|stress)|time.?sensitive|crisis|emergency|around the clock|combat/i,
    say: () => "Made sound decisions in high-pressure, time-sensitive situations." },
  { id: "mentoring", tag: "training", group: "business", corporate: "Talent development",
    re: /mentor|coach(?:ed|ing)|developed (?:junior|future|leaders)|\bpromoted\b/i,
    say: () => "Developed future leaders; [X] soldiers promoted under my mentorship." },
  { id: "sops", tag: "documentation", group: "business", corporate: "Process documentation",
    re: /\bsops?\b|standard operating procedure|wrote (?:procedures|guides|checklists)|checklists?|technical manuals?/i,
    say: () => "Wrote and maintained standard operating procedures." },
  // Other business skills the table doesn't cover
  { id: "supervision", tag: "supervision", group: "business", corporate: "Team leadership & supervision",
    re: /\bled\b|supervis|team lead|squad|section|\bnco\b|managed (?:a )?team/i,
    say: (ev, n) => withEvidence((x) => (x ? `Supervised a team of ${x}` : "Supervised a team"))(ev, n) },
  { id: "projectmgmt", tag: "projectmgmt", group: "business", corporate: "Project planning & coordination",
    re: /plan(?:ned|ning)|schedul|project/i, say: withEvidence(() => "Planned and coordinated work") },
  { id: "customer", tag: "customer", group: "business", corporate: "Client service & stakeholder communication",
    re: /customer|client|advis/i, say: withEvidence(() => "Advised and supported stakeholders") },
  { id: "documentation", tag: "documentation", group: "business", corporate: "Record-keeping & reporting",
    re: /record|\blogs?\b|paperwork|da form|report|document/i, say: withEvidence(() => "Maintained accurate records and reports") },
  { id: "safety", tag: "safety", group: "business", corporate: "Safety & compliance programs",
    re: /safety|osha|compliance/i, say: withEvidence(() => "Enforced safety procedures") },

  // ---- Technical skills ----
  { id: "diagnostics", tag: "diagnostics", group: "technical", corporate: "Root-cause troubleshooting",
    re: /troubleshoo?t|diagnos|fault|isolat(?:ed|ing) (?:failures|problems)/i, say: withEvidence(() => "Diagnosed and resolved equipment faults") },
  { id: "mechanical", tag: "mechanical", group: "technical", corporate: "Equipment maintenance & repair",
    re: /generator|engine|mechanic|repair|overhaul|hydraulic|power plant/i, say: withEvidence(() => "Repaired and maintained mechanical equipment") },
  { id: "electrical", tag: "electrical", group: "technical", corporate: "Electrical installation & testing",
    re: /electri|wir(?:ed|ing)|circuit|voltage|power distribution/i, say: withEvidence(() => "Installed and tested electrical systems") },
  { id: "maintenance", tag: "maintenance", group: "technical", corporate: "Preventive maintenance programs",
    re: /preventive|pmcs|scheduled maintenance|inspect/i,
    say: (ev, n) => withEvidence((x) => (x ? `Performed scheduled preventive maintenance on ${x}+ units` : "Performed scheduled preventive maintenance"))(ev, n) },
  { id: "it", tag: "it", group: "technical", corporate: "Technical support & systems administration",
    re: /network|computer|server|cyber|\bit\b|help ?desk/i, say: withEvidence(() => "Configured and supported IT systems") },
  { id: "driving", tag: "driving", group: "technical", corporate: "Fleet & vehicle operations",
    re: /convoy|drove|driv(?:e|ing)|truck|vehicle operat/i, say: withEvidence(() => "Operated heavy vehicles safely") },
  { id: "patientcare", tag: "patientcare", group: "technical", corporate: "Emergency & patient care",
    re: /medic|patient|triage|first aid|casualt/i, say: withEvidence(() => "Provided emergency patient care") },
  { id: "analysis", tag: "analysis", group: "technical", corporate: "Data analysis & reporting",
    re: /analy[sz]|intelligence|data/i, say: withEvidence(() => "Analyzed data and produced actionable reports") },
  { id: "construction", tag: "construction", group: "technical", corporate: "Field installation & build",
    re: /install|construct|build|fabricat|demolition|weld/i, say: withEvidence(() => "Installed and built field infrastructure") },
  { id: "security", tag: "security", group: "technical", corporate: "Physical security & incident response",
    re: /guard|security|patrol|police|investigat/i, say: withEvidence(() => "Enforced security and responded to incidents") }
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
  const tags = [...rules.filter((r) => r.re.test(text)).map((r) => r.tag).filter(Boolean),
    ...addedSkillRules.filter(([re]) => re.test(text)).map(([, t]) => t)];
  return [...new Set(tags)];
}

// Turn a confirmed record into civilian skills with evidence + a copy-ready resume line each.
export function translate(jst) {
  const sources = [];
  for (const job of jst.jobs) {
    const from = job.title || job.code;
    const typical = lookupCode(job.code)?.duties || [];
    const tasks = (job.duties || []).filter(Boolean);
    const held = (job.billets || []).filter(Boolean);
    // The person's own words come first (they carry the specifics); billets add what that position typically involves.
    tasks.forEach((d) => sources.push({ text: d, from, inferred: false }));
    for (const b of held) sources.push({ text: billetInfo(b)?.does || `Served as ${b}`, from: `Billet: ${b}`, inferred: false });
    if (isLeadershipGrade(job.grade)) sources.push({ text: `Held a leadership grade (${job.grade}), responsible for supervising others`, from: "Pay grade", inferred: true });
    if (!tasks.length && !held.length) {
      // No tasks or billets: use typical tasks if we have them, otherwise the code's title and the civilian jobs it lines up with.
      const fallback = typical.length ? typical : [job.title, ...(job.civilian || [])].filter(Boolean);
      for (const d of fallback) sources.push({ text: d, from, inferred: true });
    }
  }
  for (const c of jst.courses) sources.push({ text: c.name, from: "Course", inferred: false });

  // One card per rule, from the first thing in the record that matches it.
  const found = new Map();
  for (const src of sources) {
    for (const rule of rules) {
      if (!rule.re.test(src.text) || found.has(rule.id)) continue;
      const evidence = clean(src.text);
      found.set(rule.id, {
        id: rule.id, tag: rule.tag, group: rule.group, corporate: rule.corporate, label: rule.corporate,
        military: evidence, evidence, from: src.from, inferred: src.inferred,
        line: rule.say(evidence, number(src.text))
      });
    }
  }
  return [...found.values()];
}

export function heldCredentials(jst, extraSkills = []) {
  const text = [...jst.certs, ...jst.courses.map((c) => c.name), ...extraSkills].join("\n");
  return Object.keys(credentialKeywords).filter((id) => credentialKeywords[id].test(text));
}
