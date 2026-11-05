import { h } from "../dom.js";
import { parseJst, parseResume } from "../jst.js";
import { mosDuties, mosTitles } from "../translate.js";
import { state } from "../state.js";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = h("script", { src, onload: resolve, onerror: () => reject(new Error(`Could not load ${src}`)) });
    document.head.append(s);
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
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, r]) => out.push(r.text.trim()));
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
  if (file.type === "application/pdf") return pdfText(file);
  if (file.type === DOCX || file.name.endsWith(".docx")) return docxText(file);
  if (file.type === "text/plain") return file.text();
  return imageText(file);
}

const parseResumeText = (text) => parseResume(text, Object.keys(mosDuties));

export function intakeView(ctx) {
  const status = h("p", { class: "status", role: "status" });
  const confirmBox = h("div");
  const say = (m) => (status.textContent = m);

  function show(parsed) {
    const jobs = parsed.jobs.length ? parsed.jobs : [{ code: "", title: "", start: "", end: "", duties: [] }];
    const form = h("form", { class: "confirm" });
    const jobBoxes = [];
    const addJob = (j) => {
      const box = h("fieldset", { class: "job" },
        h("legend", {}, "Job held"),
        h("label", {}, "MOS / code", h("input", { name: "code", value: j.code })),
        h("label", {}, "Title", h("input", { name: "title", value: j.title })),
        h("label", {}, "Start", h("input", { name: "start", value: j.start })),
        h("label", {}, "End", h("input", { name: "end", value: j.end })),
        h("label", {}, "Duties (one per line). If you leave this blank, we use duties typical for the MOS and label them that way.", h("textarea", { name: "duties", rows: 5 }, j.duties.join("\n"))));
      jobBoxes.push(box);
      form.insertBefore(box, extras);
    };
    const extraLines = [...new Set([...state.extraSkills, ...(parsed.skills || [])])];
    const extras = h("div", {},
      h("button", { type: "button", class: "secondary", onclick: () => addJob({ code: "", title: "", start: "", end: "", duties: [] }) }, "+ Add another job"),
      h("label", {}, "Courses & credit recommendations (one per line)",
        h("textarea", { name: "courses", rows: 4 }, parsed.courses.map((c) => (c.credits ? `${c.name} (${c.credits})` : c.name)).join("\n"))),
      h("label", {}, "Certifications (one per line)", h("textarea", { name: "certs", rows: 3 }, parsed.certs.join("\n"))),
      h("label", {}, "Other skills (one per line)", h("textarea", { name: "extra", rows: 3 }, extraLines.join("\n"))),
      h("button", { type: "submit" }, "Looks right — continue"));
    form.append(extras);
    jobs.forEach(addJob);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (box, n) => box.querySelector(`[name=${n}]`).value.trim();
      const lines = (n) => form.querySelector(`[name=${n}]`).value.split("\n").map((l) => l.trim()).filter(Boolean);
      state.jst = {
        jobs: jobBoxes.map((b) => ({ code: val(b, "code"), title: val(b, "title"), start: val(b, "start"), end: val(b, "end"), duties: val(b, "duties").split("\n").map((l) => l.trim()).filter(Boolean) })),
        courses: lines("courses").map((l) => { const m = l.match(/^(.*?)\s*\(([^)]*)\)\s*$/); return m ? { name: m[1], credits: m[2] } : { name: l, credits: "" }; }),
        certs: lines("certs")
      };
      state.extraSkills = [...new Set(lines("extra"))];
      state.uncheckedSkills = []; // a new record means new skills to review
      ctx.next();
    });
    confirmBox.replaceChildren(h("h3", {}, "Check what we found"),
      h("p", {}, "This can include mistakes. Fix anything that's wrong before we match you."), form);
  }

  // One upload panel, used for both the resume and the JST.
  function uploadPanel({ id, fileLabel, accept, placeholder, pasteLabel, parse }) {
    const fileInput = h("input", { type: "file", accept, id });
    const paste = h("textarea", { rows: 8, placeholder, "aria-label": pasteLabel });
    async function fromFile() {
      const file = fileInput.files[0];
      if (!file) return say("Choose a file first.");
      say("Reading your file in this browser…");
      try {
        const text = await fileText(file);
        if (text.trim().length < 20) throw new Error("No readable text found");
        show(parse(text));
        say("Done. The file was read in your browser and discarded. Nothing was uploaded or saved.");
      } catch (e) {
        say(`Couldn't read that file (${e.message}). Paste the text below instead.`);
      } finally {
        fileInput.value = ""; // drop the file reference
      }
    }
    return h("div", {},
      h("label", { for: id }, fileLabel),
      fileInput,
      h("button", { type: "button", onclick: fromFile }, "Read my file"),
      h("details", {}, h("summary", {}, pasteLabel), paste,
        h("button", { type: "button", onclick: () => { if (paste.value.trim()) { show(parse(paste.value)); paste.value = ""; say("Done. Pasted text was cleared."); } } }, "Use pasted text")));
  }

  function mosPanel() {
    const input = h("input", { id: "mos-code", list: "mos-list", autocomplete: "off", placeholder: "For example, 52D" });
    const list = h("datalist", { id: "mos-list" }, Object.entries(mosTitles).map(([code, title]) => h("option", { value: code }, title)));
    return h("form", { onsubmit: (e) => {
      e.preventDefault();
      const code = input.value.trim().split(/[\s–—-]/)[0].toUpperCase();
      if (!code) return say("Enter your MOS code first.");
      show({ jobs: [{ code, title: mosTitles[code] || "", start: "", end: "", duties: [] }], courses: [], certs: [], skills: [] });
      say(mosDuties[code]
        ? `Found ${code}. We'll start from duties typical for this MOS. Add your own below for stronger resume lines.`
        : `We don't have typical duties for ${code} yet, so add your duties below. Your skills come from what you enter.`);
    } },
      h("label", { for: "mos-code" }, "Your MOS code"), input, list,
      h("button", { type: "submit" }, "Use this MOS"));
  }

  const panels = {
    mos: { label: "MOS", panel: mosPanel() },
    resume: { label: "Resume", panel: uploadPanel({
      id: "resume-file", fileLabel: "Resume as a PDF, Word file, text file, or photo",
      accept: `application/pdf,${DOCX},.docx,text/plain,image/*`, parse: parseResumeText,
      pasteLabel: "…or paste your resume text instead", placeholder: "Paste your resume here (experience, skills, certifications, education)" }) },
    jst: { label: "JST", panel: uploadPanel({
      id: "jst-file", fileLabel: "JST as a PDF or photo",
      accept: "application/pdf,image/*", parse: parseJst,
      pasteLabel: "…or paste the text instead", placeholder: "Paste the text of your JST here (jobs held, dates, courses, credit recommendations, certifications)" }) }
  };
  const tabs = Object.entries(panels).map(([key, p]) => {
    const b = h("button", { type: "button", class: "tab", onclick: () => pick(key) }, p.label);
    p.tab = b;
    return b;
  });
  function pick(key) {
    for (const [k, p] of Object.entries(panels)) {
      p.tab.setAttribute("aria-pressed", String(k === key));
      p.panel.hidden = k !== key;
    }
  }
  pick("mos");

  return h("section", {},
    h("h2", {}, "Start with your service background"),
    h("p", {}, "Choose whichever is easiest. You can add other skills in a later step."),
    h("div", { class: "tabs", role: "group", "aria-label": "How to share your background" }, tabs),
    h("p", { class: "privacy" }, "🔒 Files can contain sensitive identifiers. We read them in your browser, strip IDs, SSNs, and contact details, keep only your skills data, and discard the file. Nothing is uploaded or stored."),
    Object.values(panels).map((p) => p.panel),
    status, confirmBox);
}
