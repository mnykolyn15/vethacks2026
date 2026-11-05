// Heuristic JST text parser. Parsing WILL make mistakes, so the UI always shows the result
// for the user to confirm or fix. Privacy: identifiers are redacted before anything is parsed,
// and only the structured skills data below is kept.

export function redact(text) {
  return text
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[removed]")   // SSN
    .replace(/\b\d{10}\b/g, "[removed]")                       // DoD ID
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]");         // email
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
  return { jobs, courses, certs };
}
