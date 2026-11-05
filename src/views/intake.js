import { h } from "../dom.js";
import { parseJst, parseResume } from "../jst.js";
import { codes, lookupCode, normalizeCode, billets, billetInfo, payGrades } from "../data/military.js";
import { loadCodes, searchCodes, findCode } from "../data/codeSearch.js";
import { field, tagList, combobox, nextId } from "../ui.js";
import { state } from "../state.js";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SAMPLE_JST = "samples/jordan-lee-jst.pdf";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    document.head.append(h("script", { src, onload: resolve, onerror: () => reject(new Error(`Could not load ${src}`)) }));
  });
}

async function pdfText(file) {
  await loadScript(PDFJS);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const out = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const items = (await (await pdf.getPage(p)).getTextContent()).items;
    const rows = new Map();
    for (const it of items) {
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      const row = rows.get(y) || { text: "", end: x };
      // Text fragments aren't always whole words (a ligature like "fi" can be its own item),
      // so only add a space where there's a visible gap.
      row.text += (x - row.end > 1 ? " " : "") + it.str;
      row.end = x + it.width;
      rows.set(y, row);
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, r]) => out.push(r.text.replace(/\s+/g, " ").trim()));
  }
  return out.join("\n");
}

async function imageText(file) {
  await loadScript(TESSERACT);
  return (await window.Tesseract.recognize(file, "eng")).data.text;
}

async function docxText(file) {
  await loadScript(MAMMOTH);
  return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
}

function fileText(file) {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return pdfText(file);
  if (file.type === DOCX || file.name.endsWith(".docx")) return docxText(file);
  if (file.type === "text/plain" || file.name.endsWith(".txt")) return file.text();
  return imageText(file);
}

// Resume parsing only trusts numeric codes (MOS/AFSC); 2-letter Navy rates like "IT" are too common as words.
const numericCodes = codes.map((c) => c.code).filter((c) => /^\d/.test(c));
const parseResumeText = (text) => parseResume(text, numericCodes);

// Combine what each source found into one record: same code = same job.
function merge(parts, typedCode, pickedHit) {
  const jobs = [];
  const courses = [];
  const certs = [];
  const skills = [];
  const uniq = (list, items) => items.forEach((i) => { if (i && !list.some((x) => x.toLowerCase() === i.toLowerCase())) list.push(i); });
  for (const p of parts) {
    for (const j of p.jobs) {
      const code = normalizeCode(j.code);
      const same = code && jobs.find((x) => x.code === code);
      if (same) {
        same.title ||= j.title;
        same.grade ||= j.grade;
        uniq(same.billets, j.billets);
        uniq(same.duties, j.duties);
      } else jobs.push({ code, title: j.title, grade: j.grade || "", branch: j.branch || "", civilian: j.civilian || [], billets: [...(j.billets || [])], duties: [...(j.duties || [])] });
    }
    uniq(courses, p.courses.map((c) => c.name));
    uniq(certs, p.certs);
    uniq(skills, p.skills || []);
  }
  const code = normalizeCode(typedCode);
  if (code && !jobs.some((j) => j.code === code)) {
    const bare = jobs.filter((j) => !j.code);
    const hit = pickedHit?.code === code ? pickedHit : null; // honor the exact entry the person picked
    const extra = hit ? { title: hit.title, branch: hit.branch, civilian: hit.civilian } : {};
    // A typed code belongs to a resume job only when nothing else supplied a code; otherwise it's its own job.
    if (bare.length === 1 && !jobs.some((j) => j.code)) Object.assign(bare[0], { code, ...extra });
    else jobs.push({ code, title: "", grade: "", branch: "", civilian: [], billets: [], duties: [], ...extra });
  }
  for (const j of jobs) {
    const hit = findCode(j.code, j.branch);
    if (!hit) continue;
    j.title ||= hit.title;
    j.branch ||= hit.branch;
    if (!j.civilian?.length) j.civilian = hit.civilian;
  }
  return { jobs, courses: courses.map((name) => ({ name })), certs, skills };
}

// One job on the confirm form.
function jobCard(job, onRemove) {
  const codeId = nextId("code");
  let branch = job.branch || "";
  let civilian = job.civilian || [];
  const found = h("p", { class: "found", role: "status" });
  const civ = h("p", { class: "hint" });
  const title = h("input", { id: nextId("title"), value: job.title, placeholder: "For example, Power Generation Equipment Repairer" });
  let titleIsAuto = false; // a title we filled in from the code can be replaced when the code changes; one the person typed can't
  title.addEventListener("input", () => { titleIsAuto = false; });
  const grade = h("select", { id: nextId("grade") }, h("option", { value: "" }, "Skip"),
    payGrades.map((g) => h("option", { value: g, selected: g === job.grade }, g)));
  const billetList = tagList({
    items: job.billets, label: "Billet", placeholder: "Or type your own, such as Team Leader",
    note: (b) => (billetInfo(b)?.civilian ? `Civilian title: ${billetInfo(b).civilian}` : "")
  });
  billetList.setSuggestions(billets.map((b) => b.title));
  const tasks = tagList({ items: job.duties, label: "What you did", placeholder: "For example, Repaired generators and kept them running", inlineSuggestions: false });
  const typical = h("div", {});

  function apply(hit, fill) {
    branch = hit.branch;
    civilian = hit.civilian;
    if (fill && (!title.value.trim() || titleIsAuto)) { title.value = hit.title; titleIsAuto = true; }
    found.textContent = `Found: ${hit.code} — ${hit.title} (${hit.branch}${hit.retired ? ", retired code" : ""})`;
    civ.textContent = hit.civilian.length ? `Civilian jobs that line up with this code: ${hit.civilian.slice(0, 3).join(", ")}.` : "";
    const duties = lookupCode(hit.code)?.duties || [];
    tasks.setSuggestions(duties);
    typical.hidden = !duties.length;
  }
  function clear() {
    branch = ""; civilian = [];
    found.textContent = code.value.trim() ? "We don't have this code. That's fine: add your title and what you did below." : "";
    civ.textContent = "";
    tasks.setSuggestions([]);
    typical.hidden = true;
  }
  const codeBox = combobox({ id: codeId, value: job.code, label: "MOS, AFSC, or rate", placeholder: "Search by code or title, like 0311, 3E0X2, EM, or rifleman",
    search: searchCodes, onpick: (hit) => apply(hit, true) });
  const code = codeBox.input;
  // Typing a full code without picking from the list still finds it.
  code.addEventListener("change", () => { const hit = findCode(code.value, branch); if (hit) apply(hit, true); else clear(); });
  typical.append(h("p", { class: "hint" }, "Typical tasks for this code. Tap any that match what you did:"), tasks.sugEl);
  const start = findCode(job.code, job.branch);
  if (start) apply(start, false); else clear();

  const el = h("fieldset", { class: "job" },
    h("legend", {}, "Your service job"),
    field("MOS, AFSC, or rate", codeBox.el, "Your job code. The Army and Marine Corps use an MOS (like 91D or 0311), the Air Force uses an AFSC (like 3E0X2), and the Navy and Coast Guard use a rate (like EM or HM). It's on your DD-214, JST, or orders. You can also search by job title.", { forId: codeId }),
    found, civ,
    field("Job title", title, "Your MOS title, like Power Generation Equipment Repairer. This is the functional title: the job you did day to day.", { forId: title.id }),
    field("Pay grade (optional)", grade, "For example, E-5 is a Sergeant in the Army. It helps show leadership experience. It's on your DD-214 or JST.", { forId: grade.id }),
    field("Billets you held", billetList.el, "A billet is the position you held, like Team Leader, Squad Leader, or Shop Foreman. It works like a corporate title, while your MOS title is the functional one. Tap any that fit, or type your own."),
    field("What you did (optional)", h("div", {}, tasks.el, typical), "Short lines about your work, like “Repaired generators and kept them running” or “Trained 6 new technicians”. Numbers help. If you skip this, we'll use typical tasks for your code and label them that way."),
    onRemove ? h("button", { type: "button", class: "linklike", onclick: onRemove }, "Remove this job") : null);

  return { el, get: () => ({ code: normalizeCode(code.value), title: title.value.trim(), grade: grade.value, branch, civilian, billets: billetList.get(), duties: tasks.get() }) };
}

export function intakeView(ctx) {
  const status = h("p", { class: "status", role: "status" });
  const confirmBox = h("div", { id: "confirm-box" });

  function showConfirm(parsed) {
    const cards = [];
    const jobsBox = h("div", {});
    const addJob = (job) => {
      const card = jobCard(job, cards.length ? () => { cards.splice(cards.indexOf(card), 1); card.el.remove(); } : null);
      cards.push(card);
      jobsBox.append(card.el);
    };
    (parsed.jobs.length ? parsed.jobs : [{ code: "", title: "", grade: "", branch: "", civilian: [], billets: [], duties: [] }]).forEach(addJob);

    const courses = tagList({ items: parsed.courses.map((c) => c.name), label: "Course", placeholder: "Add a course" });
    const certs = tagList({ items: parsed.certs, label: "Certification or training", placeholder: "For example, OSHA 30, CDL, or EPA 608" });
    const extra = tagList({ items: [...new Set([...state.extraSkills, ...(parsed.skills || [])])], label: "Skill", placeholder: "For example, welding, Spanish, or budgeting" });
    const error = h("p", { class: "error", role: "alert" });

    const form = h("form", { class: "confirm", onsubmit: (e) => {
      e.preventDefault();
      const jobs = cards.map((c) => c.get()).filter((j) => j.code || j.title || j.billets.length || j.duties.length);
      if (!jobs.length) { error.textContent = "Add at least one job: a code, a title, or what you did."; return; }
      state.jst = { jobs, courses: courses.get().map((name) => ({ name })), certs: certs.get() };
      state.extraSkills = extra.get();
      state.uncheckedSkills = []; // a new record means new skills to review
      state.location = null; // not the demo veteran anymore
      state.dream = null;
      state.firstJob = null;
      state.dreamNote = "";
      ctx.next();
    } },
      jobsBox,
      h("button", { type: "button", class: "secondary", onclick: () => addJob({ code: "", title: "", grade: "", branch: "", civilian: [], billets: [], duties: [] }) }, "+ Add another job"),
      h("fieldset", {}, h("legend", {}, "Courses and certifications"),
        field("Courses from your record", courses.el, "Pulled from your JST. Remove any that aren't right, or add ones that are missing."),
        field("Certifications and training since service", certs.el, "Add anything you earned after you left the military, or that isn't on your JST, like OSHA 30, CDL, EPA 608, or a trade license. We use these to see what you already have.")),
      h("fieldset", {}, h("legend", {}, "Other skills"),
        field("Skills from anywhere else (optional)", extra.el, "Civilian jobs, hobbies, languages, or what you handle at home. You can also add skills on the next steps.")),
      error,
      h("button", { type: "submit" }, "Looks right — continue"));
    confirmBox.replaceChildren(h("h3", {}, "Check what we found"),
      h("p", {}, "We can get things wrong, so fix anything that looks off. Nothing here is saved anywhere."), form);
    confirmBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---- The three ways to share a background ----
  const resumeFile = h("input", { type: "file", id: "resume-file", accept: `application/pdf,${DOCX},.docx,text/plain,image/*` });
  const resumePaste = h("textarea", { rows: 6, "aria-label": "Paste your resume text", placeholder: "Paste your resume here (experience, skills, certifications, education)" });
  const jstFile = h("input", { type: "file", id: "jst-file", accept: "application/pdf,image/*" });
  const jstPaste = h("textarea", { rows: 6, "aria-label": "Paste your JST text", placeholder: "Paste the text of your JST here (occupation, courses, certifications)" });
  loadCodes(); // fetch the full code list now so search is instant
  let pickedHit = null;
  const codeBox = combobox({ id: "code-input", label: "MOS, AFSC, or rate", placeholder: "Search by code or title, like 0311, 3E0X2, EM, or rifleman",
    search: searchCodes, onpick: (hit) => { pickedHit = hit; refresh(); } });
  const codeInput = codeBox.input;
  codeInput.addEventListener("input", () => { pickedHit = null; });

  const read = async (file, paste, parse, what) => {
    if (file) return parse(await fileText(file));
    if (paste.trim()) return parse(paste);
    return null;
  };

  async function build(sampleJst) {
    const files = { resume: resumeFile.files[0], jst: sampleJst || jstFile.files[0] };
    const typed = codeInput.value.trim();
    if (!files.resume && !files.jst && !resumePaste.value.trim() && !jstPaste.value.trim() && !typed) {
      status.textContent = "Add at least one of these first: a resume, a JST, or a code.";
      return;
    }
    status.textContent = "Reading in your browser…";
    await loadCodes();
    const parts = [];
    try {
      const resume = await read(files.resume, resumePaste.value, parseResumeText, "resume");
      if (resume) parts.push(resume);
    } catch (e) { status.textContent = `Couldn't read your resume (${e.message}). Paste its text instead.`; return; }
    try {
      const jst = await read(files.jst, jstPaste.value, parseJst, "JST");
      if (jst) parts.push(jst);
    } catch (e) { status.textContent = `Couldn't read your JST (${e.message}). Paste its text instead.`; return; }
    resumeFile.value = ""; jstFile.value = ""; // drop the file references
    resumePaste.value = ""; jstPaste.value = "";
    status.textContent = "Done. Files were read in your browser and discarded. Nothing was uploaded or saved.";
    showConfirm(merge(parts, typed, pickedHit));
  }

  // Each source shows a "✓ Added" badge once it has something in it, and the button says how many are in use.
  const sources = [];
  const panel = (title, note, has, ...kids) => {
    const badge = h("span", { class: "badge-added", hidden: true }, "✓ Added");
    const el = h("div", { class: "source" }, h("h3", {}, title, badge, h("small", {}, note)), ...kids);
    sources.push({ el, badge, has });
    return el;
  };
  const buildBtn = h("button", { type: "button", onclick: () => build() }, "Build my profile");
  function refresh() {
    let n = 0;
    for (const { el, badge, has } of sources) {
      const on = has();
      badge.hidden = !on;
      el.classList.toggle("has-input", on);
      if (on) n += 1;
    }
    buildBtn.textContent = n ? `Build my profile from ${n} ${n === 1 ? "source" : "sources"}` : "Build my profile";
  }

  const root = h("section", { class: "intake" },
    h("h2", {}, "Tell us about your service"),
    h("p", { class: "lead" }, "Add any or all of these. Each one fills in more, and we combine them for you to check."),
    h("p", { class: "privacy" }, "🔒 Files can contain sensitive identifiers. We read them in your browser, strip IDs, SSNs, and contact details, keep only your skills data, and discard the file. Nothing is uploaded or stored."),
    h("div", { class: "sources" },
      panel("1. Resume", "PDF, Word, text, or photo", () => resumeFile.files.length || resumePaste.value.trim(),
        h("label", { for: "resume-file", class: "sr-only" }, "Resume file"), resumeFile,
        h("details", {}, h("summary", {}, "Or paste your resume text"), resumePaste)),
      panel("2. JST", "Joint Services Transcript, PDF or photo", () => jstFile.files.length || jstPaste.value.trim(),
        h("label", { for: "jst-file", class: "sr-only" }, "JST file"), jstFile,
        h("details", {}, h("summary", {}, "Or paste your JST text"), jstPaste),
        h("button", { type: "button", class: "linklike", onclick: async () => {
          try { build(new File([await (await fetch(SAMPLE_JST)).blob()], "jordan-lee-jst.pdf", { type: "application/pdf" })); }
          catch { status.textContent = "Couldn't load the sample JST."; }
        } }, "No JST handy? Try the sample (made-up Jordan Lee)")),
      panel("3. MOS, AFSC, or rate", "Your job code or title", () => codeInput.value.trim(),
        h("label", { for: "code-input", class: "sr-only" }, "MOS, AFSC, or rate"), codeBox.el,
        h("p", { class: "hint" }, "The Army and Marine Corps use an MOS, the Air Force an AFSC, and the Navy and Coast Guard a rate. Search by code or by job title."))),
    buildBtn,
    status, confirmBox,
    h("p", { class: "hint source-note" }, "Code data: Defense Manpower Data Center military crosswalk, published by the O*NET Resource Center (onetcenter.org)."));
  for (const el of [resumeFile, jstFile, resumePaste, jstPaste, codeInput]) { el.addEventListener("change", refresh); el.addEventListener("input", refresh); }
  return root;
}
