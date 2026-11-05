import { h } from "../dom.js";
import { parseJst, redact } from "../jst.js";
import { state } from "../state.js";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

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
      rows.set(y, (rows.get(y) || "") + it.str + " ");
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, t]) => out.push(t.trim()));
  }
  return out.join("\n");
}

async function imageText(file) {
  await loadScript(TESSERACT);
  return (await window.Tesseract.recognize(file, "eng")).data.text;
}

export function intakeView(ctx) {
  const status = h("p", { class: "status", role: "status" });
  const confirmBox = h("div");
  const paste = h("textarea", { rows: 8, placeholder: "Paste the text of your JST here (jobs held, dates, courses, credit recommendations, certifications)" });
  const fileInput = h("input", { type: "file", accept: "application/pdf,image/*", id: "jst-file" });

  const say = (m) => (status.textContent = m);

  async function fromFile() {
    const file = fileInput.files[0];
    if (!file) return;
    say("Reading your file in this browser…");
    try {
      const text = file.type === "application/pdf" ? await pdfText(file) : await imageText(file);
      if (text.trim().length < 20) throw new Error("No readable text found");
      show(parseJst(text));
      say("Done. The file was read in your browser and discarded. Nothing was uploaded or saved.");
    } catch (e) {
      say(`Couldn't read that file (${e.message}). Paste the text below instead.`);
    } finally {
      fileInput.value = ""; // drop the file reference
    }
  }

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
        h("label", {}, "Duties (one per line)", h("textarea", { name: "duties", rows: 5 }, j.duties.join("\n"))));
      jobBoxes.push(box);
      form.insertBefore(box, extras);
    };
    const extras = h("div", {},
      h("button", { type: "button", class: "secondary", onclick: () => addJob({ code: "", title: "", start: "", end: "", duties: [] }) }, "+ Add another job"),
      h("label", {}, "Courses & credit recommendations (one per line)",
        h("textarea", { name: "courses", rows: 4 }, parsed.courses.map((c) => (c.credits ? `${c.name} (${c.credits})` : c.name)).join("\n"))),
      h("label", {}, "Certifications (one per line)", h("textarea", { name: "certs", rows: 3 }, parsed.certs.join("\n"))),
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
      ctx.next();
    });
    confirmBox.replaceChildren(h("h3", {}, "Check what we found"),
      h("p", {}, "Parsing can make mistakes. Fix anything that's wrong before we match you."), form);
  }

  return h("section", {},
    h("h2", {}, "Upload your JST"),
    h("p", { class: "privacy" }, "🔒 Your JST can contain sensitive identifiers. We read it in your browser, strip IDs and SSNs, keep only your skills data, and delete the file. Nothing is uploaded or stored."),
    h("label", { for: "jst-file" }, "JST as a PDF or photo"),
    fileInput,
    h("button", { type: "button", onclick: fromFile }, "Read my file"),
    h("details", { open: true }, h("summary", {}, "…or paste the text instead"), paste,
      h("button", { type: "button", onclick: () => { if (paste.value.trim()) { show(parseJst(paste.value)); paste.value = ""; say("Done. Pasted text was cleared."); } } }, "Use pasted text")),
    status, confirmBox);
}
