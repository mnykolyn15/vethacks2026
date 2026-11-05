// Heuristic JST text parser. Parsing WILL make mistakes, so the UI always shows the result
// for the user to confirm or fix. Privacy: identifiers are redacted before anything is parsed,
// and only the structured skills data below is kept.

export function redact(text) {
  return text
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[removed]")   // SSN
    .replace(/\b\d{10}\b/g, "[removed]")                       // DoD ID
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]")          // email
    .replace(/(?:\+?1[-. ]?)?\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g, "[removed]"); // phone
}

const OCC = /^(?:MOS|Military Occupational (?:Specialty|Classification)|Occupation)?\s*:?\s*(\d{2}[A-Z]\d?)\s*[-–—:]\s*(.{3,80})$/i;
const OCC_OTHER = /^(?:AFSC|Rating|NEC)\s*:?\s*(\S+)\s*[-–—:]\s*(.{3,80})$/i;
const DATES = /((?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{1,2}\/\d{4})|(?:[A-Z][a-z]{2,8}\.? \d{4})|(?:\d{4}-\d{2}))\s*(?:-|–|to)\s*((?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{1,2}\/\d{4})|(?:[A-Z][a-z]{2,8}\.? \d{4})|(?:\d{4}-\d{2})|Present|Current)/i;
const BULLET = /^[•\-*·▪◦]\s*/;
const DUTY = /^(?:Led|Ran|Taught|Built|Wrote|Managed|Supervised|Performed|Maintained|Operated|Troubleshot|Repaired|Inspected|Installed|Trained|Planned|Coordinated|Enforced|Conducted|Provided|Processed|Analyzed|Briefed|Wired|Tested|Diagnosed)\b/i;
const COURSE = /course|school|training|\bAIT\b|leader|certificate|academy/i;
const CERT = /certif|licen[sc]e|\b(?:EPA|OSHA|CDL|CompTIA|ASE|Security\+|A\+|Network\+)\b/i;
const CREDITS = /\(?\b(\d+(?:\.\d+)?)\s*(?:SH|semester hours?|credits?)\b[^)]*\)?/i;

export function parseJst(rawText) {
  const lines = redact(rawText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const jobs = [];
  const courses = [];
  const certs = [];
  let current = null;

  lines.forEach((line, i) => {
    const occ = line.match(OCC) || line.match(OCC_OTHER);
    if (occ) {
      current = { code: occ[1].toUpperCase(), title: occ[2].trim(), start: "", end: "", duties: [] };
      jobs.push(current);
      const d = [line, lines[i + 1] || "", lines[i + 2] || ""].join(" ").match(DATES);
      if (d) { current.start = d[1]; current.end = d[2]; }
      return;
    }
    const credit = line.match(CREDITS);
    if (CERT.test(line) && !DUTY.test(line.replace(BULLET, ""))) { certs.push(line.replace(BULLET, "")); return; }
    if (COURSE.test(line) && !DUTY.test(line.replace(BULLET, "")) && line.length < 120) {
      courses.push({ name: line.replace(BULLET, "").replace(CREDITS, "").replace(/[\s,;:-]+$/, ""), credits: credit ? `${credit[1]} SH` : "" });
      return;
    }
    const body = line.replace(BULLET, "");
    if (current && (BULLET.test(line) || DUTY.test(body))) current.duties.push(body);
  });
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
const MOS_LABELLED = /\bMOS\b\W*(\d{2}[A-Z]\d?)\b/i;
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
  const codeIn = (s) => (s.match(MOS_LABELLED) || (known && s.match(known)) || [])[1]?.toUpperCase() || "";
  let section = hasSections ? "other" : "experience";
  let current = null;
  let pending = ""; // a heading-like line that may turn out to be a job title

  const startJob = (title, start = "", end = "") => {
    current = { code: codeIn(title), title: title.slice(0, 80), start, end, duties: [] };
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
      if (name) courses.push({ name, credits: "" });
    } else if (section === "experience") {
      if (current && line.length <= 30 && MOS_LABELLED.test(line)) { current.code = codeIn(line); continue; }
      const dates = line.match(DATES);
      if (dates) {
        startJob(pending || tidy(line), dates[1], dates[2]);
      } else if (BULLET.test(line) || DUTY.test(body)) {
        if (!current || pending) startJob(pending);
        current.duties.push(body);
      } else {
        pending = line;
      }
    }
  }

  // "MOS 52D" is often written apart from the job it belongs to.
  const mos = codeIn(lines.join("\n"));
  if (mos && !jobs.some((j) => j.code)) {
    const military = jobs.find((j) => /army|soldier|military|\bus[ma]c?\b|navy|air force|marine/i.test(`${j.title} ${j.duties.join(" ")}`));
    if (military) military.code = mos;
    else if (!jobs.length) jobs.push({ code: mos, title: "", start: "", end: "", duties: [] });
  }
  return { jobs, courses, certs, skills: [...new Set(skills)] };
}
