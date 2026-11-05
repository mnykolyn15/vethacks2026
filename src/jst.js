// Heuristic JST and resume text parsers. Parsing WILL make mistakes, so the UI always shows the
// result for the user to confirm or fix. Privacy: identifiers are redacted before anything is
// parsed, and only the structured data below is kept (no names, dates, or credit recommendations).
import { lookupCode, normalizeCode } from "./data/military.js";

export function redact(text) {
  return text
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[removed]")   // SSN
    .replace(/\b\d{10}\b/g, "[removed]")                       // DoD ID
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]")          // email
    .replace(/(?:\+?1[-. ]?)?\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g, "[removed]"); // phone
}

const emptyJob = (code = "", title = "") => ({ code, title, grade: "", billets: [], duties: [] });
const BULLET = /^[•\-*·▪◦]\s*/;
const DUTY = /^(?:Led|Ran|Taught|Built|Wrote|Planned|Plans?|(?:Lead|Manag|Supervis|Perform|Maintain|Operat|Repair|Inspect|Install|Train|Coordinat|Enforc|Conduct|Provid|Process|Analyz|Brief|Wir|Test|Diagnos|Troubleshoot|Teach|Build|Write|Run)(?:e|es|ed|s|d|ing)?)\b/i;
const DATES = /((?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{1,2}\/\d{4})|(?:[A-Z][a-z]{2,8}\.? \d{4})|(?:\d{4}-\d{2}))\s*(?:-|–|to)\s*((?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{1,2}\/\d{4})|(?:[A-Z][a-z]{2,8}\.? \d{4})|(?:\d{4}-\d{2})|Present|Current)/i;
const CERT = /certif|licen[sc]e|\b(?:EPA|OSHA|CDL|CompTIA|ASE|Security\+|A\+|Network\+)\b/i;
const GRADE = /\b(?:pay\s*grade|grade|rank)\s*[:#]?\s*([EWO])\s*-?\s*(\d{1,2})\b/i;

// Occupation lines. Code-first ("91D - Title", "91D Title") or labelled ("MOS: 91D", "Occupation: EM Electrician's Mate").
const CODE = "\\d{2,3}[A-Z]\\d?|\\d{4}|\\d[A-Z]\\d[0-9X]\\d|[A-Z]{2,3}";
const OCC_LABELLED = new RegExp(`^(?:MOS|AFSC|Rating|Rate|NEC|Occupation(?: Code)?|Military Occupational (?:Specialty|Classification))\\s*[:#-]?\\s*(${CODE})\\b\\s*[-–—:]?\\s*(.{0,80})$`, "i");
const OCC_DASHED = /^(\d{2,3}[A-Z]\d?|\d{4}|\d[A-Z]\d[0-9X]\d)\s*[-–—:]\s*(.{3,80})$/;
const OCC_SPACED = /^(\d{2,3}[A-Z]\d?)\s+([A-Z][A-Za-z ,'/&()-]{3,80})$/;

// Course lines: labelled ("Course Title: X") or anything that reads like a course name.
const COURSE_LABELLED = /^(?:course\s*(?:title|name)|title)\s*:\s*(.{3,100})$/i;
const COURSE_WORDS = /course|school|training|\bAIT\b|leader|certificate|academy|\bBLC\b|\bALC\b/i;
// Lines that belong to a course entry but aren't the course name. Credit recommendations are dropped on purpose.
const NOT_A_COURSE = /course\s*(?:number|id|length)|location|dates?:|completion|credit|recommend|\bACE\b|semester|\bSH\b|exhibit|vocational|lower[- ]division|upper[- ]division|hours/i;

// Section headings like "MILITARY COURSES" are not course names.
const HEADING = /^(?:military\s+)?(?:courses?(?:\s+completions?)?|occupations?|training|education|certifications?)\s*:?$/i;

function occupationOf(line) {
  const m = line.match(OCC_LABELLED) || line.match(OCC_DASHED) || line.match(OCC_SPACED);
  if (!m) return null;
  const code = normalizeCode(m[1]);
  const known = lookupCode(code);
  // Two-to-three letter labelled codes are only trusted if we know them (rates like EM, IT).
  if (/^[A-Z]{2,3}$/.test(code) && !known) return null;
  const title = (m[2] || "").replace(DATES, "").replace(/[\s|,;:–—-]+$/, "").trim();
  return { code, title: title || known?.title || "" };
}

export function parseJst(rawText) {
  const lines = redact(rawText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const jobs = [];
  const courses = [];
  const certs = [];
  let current = null;
  const seen = new Set();
  const addCourse = (name) => {
    const n = name.replace(BULLET, "").replace(/\(?\b\d+(?:\.\d+)?\s*(?:SH|semester hours?|credits?)\b[^)]*\)?/gi, "").replace(/[\s,;:-]+$/, "").trim();
    if (n.length >= 4 && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); courses.push({ name: n }); }
  };

  for (const line of lines) {
    if (HEADING.test(line)) continue;
    const grade = line.match(GRADE);
    if (grade && current && !current.grade) current.grade = `${grade[1].toUpperCase()}-${grade[2]}`;
    const occ = occupationOf(line);
    if (occ) {
      current = emptyJob(occ.code, occ.title);
      jobs.push(current);
      continue;
    }
    const body = line.replace(BULLET, "");
    if (CERT.test(line) && !DUTY.test(body) && !NOT_A_COURSE.test(line)) { certs.push(body); continue; }
    const labelled = line.match(COURSE_LABELLED);
    if (labelled) { addCourse(labelled[1]); continue; }
    if (COURSE_WORDS.test(line) && !NOT_A_COURSE.test(line) && !DUTY.test(body) && line.length < 120) { addCourse(line); continue; }
    if (current && (BULLET.test(line) || DUTY.test(body))) current.duties.push(body);
  }
  // Pay grade often sits above the occupation line on a JST, so fall back to the first one found.
  const any = lines.map((l) => l.match(GRADE)).find(Boolean);
  if (any && jobs.length && !jobs.some((j) => j.grade)) jobs[0].grade = `${any[1].toUpperCase()}-${any[2]}`;
  return { jobs, courses, certs, skills: [] };
}

// Resume headings -> the section they open.
const SECTIONS = [
  ["experience", /^(?:(?:work|professional|military|relevant)\s+)*(?:experience|history|employment)(?:\s+history)?$/i],
  ["skills", /^(?:(?:technical|core|key|relevant)\s+)*(?:skills|competencies|proficiencies|expertise)(?:\s*(?:&|and)\s*\w+)?$/i],
  ["certs", /^(?:certifications?|licen[sc]es?)(?:\s*(?:&|and)\s*\w+)?$/i],
  ["education", /^(?:education|training|courses?|coursework)(?:\s*(?:&|and)\s*\w+)?$/i],
  ["other", /^(?:summary|objective|profile|about(?: me)?|references|awards|honors|interests|volunteer(?:ing)?(?: experience)?|contact)(?:\s*(?:&|and)\s*\w+)?$/i]
];
const sectionOf = (line) => {
  const text = line.replace(/[:\s]+$/, "");
  return text.length <= 45 ? SECTIONS.find(([, re]) => re.test(text))?.[0] : undefined;
};
const MOS_LABELLED = /\b(?:MOS|AFSC|rating)\b\W*(\d{2}[A-Z]\d?|\d{4}|\d[A-Z]\d[0-9X]\d)\b/i;
const tidy = (s) => s.replace(DATES, "").replace(/^[\s|,;:–—-]+|[\s|,;:–—-]+$/g, "");

// Heuristic resume parser. As with the JST, the user confirms the result. Contact details are
// redacted first, and the name and summary are never kept: only jobs, education, certs, and skills.
export function parseResume(rawText, knownCodes = []) {
  const lines = redact(rawText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hasSections = lines.some(sectionOf);
  const jobs = [];
  const courses = [];
  const certs = [];
  const skills = [];
  const known = knownCodes.length ? new RegExp(`\\b(${knownCodes.join("|")})\\b`) : null;
  const codeIn = (s) => normalizeCode((s.match(MOS_LABELLED) || (known && s.match(known)) || [])[1] || "");
  let section = hasSections ? "other" : "experience";
  let current = null;
  let pending = ""; // a heading-like line that may turn out to be a job title

  const startJob = (title) => {
    current = emptyJob(codeIn(title), title.slice(0, 80));
    jobs.push(current);
    pending = "";
  };

  for (const line of lines) {
    const next = sectionOf(line);
    if (next) { section = next; pending = ""; continue; }
    const body = line.replace(BULLET, "");
    if (section === "skills") {
      skills.push(...body.replace(/^[^:]{1,30}:\s*/, "").split(/\s*[,;|•·]\s*/).map((t) => t.trim()).filter((t) => t && t.length <= 60));
    } else if (section === "certs") {
      certs.push(tidy(body));
    } else if (section === "education") {
      const name = tidy(body);
      if (name) courses.push({ name });
    } else if (section === "experience") {
      if (current && line.length <= 30 && MOS_LABELLED.test(line)) { current.code = codeIn(line); continue; }
      if (DATES.test(line)) {
        startJob(pending || tidy(line));
      } else if (BULLET.test(line) || DUTY.test(body)) {
        if (!current || pending) startJob(pending);
        current.duties.push(body);
      } else {
        pending = line;
      }
    }
  }

  // "MOS 91D" is often written apart from the job it belongs to.
  const mos = codeIn(lines.join("\n"));
  if (mos && !jobs.some((j) => j.code)) {
    const military = jobs.find((j) => /army|soldier|military|\bus[ma]c?\b|navy|air force|marine/i.test(`${j.title} ${j.duties.join(" ")}`));
    if (military) military.code = mos;
    else if (!jobs.length) jobs.push(emptyJob(mos, lookupCode(mos)?.title || ""));
  }
  return { jobs, courses, certs, skills: [...new Set(skills)] };
}
