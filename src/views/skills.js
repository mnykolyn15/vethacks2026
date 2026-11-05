import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { skillLabels } from "../translate.js";
import { credentials } from "../data/credentials.js";

function addedNote(a) {
  const counts = [...a.creds.map((c) => credentials[c].name), ...a.tags.map((t) => skillLabels[t])];
  if (!counts.length) return "Added by you. It's kept for your resume, but we can't match it to a role yet.";
  return `Added by you. Counts toward: ${counts.join(", ")}.${a.creds.length ? "" : " Add a specific example before using it on a resume."}`;
}

export function skillsView(ctx) {
  const prof = profile();
  const items = prof.skillItems;
  const allLines = [...items.filter((i) => i.confirmed).map((i) => i.line), ...prof.added.map((a) => a.line)];
  const copyAll = h("button", { class: "secondary", onclick: async () => {
    await navigator.clipboard.writeText(allLines.map((l) => `• ${l}`).join("\n"));
    copyAll.textContent = "Copied!"; setTimeout(() => (copyAll.textContent = "Copy all lines"), 1500);
  } }, "Copy all lines");

  const addSkill = (text) => {
    const t = text.trim();
    if (!t) return;
    const seen = state.extraSkills.some((x) => x.toLowerCase() === t.toLowerCase());
    if (!seen) state.extraSkills = [...state.extraSkills, t];
    ctx.refresh();
    document.getElementById("other-skill")?.focus();
  };
  const removeSkill = (text) => { state.extraSkills = state.extraSkills.filter((x) => x !== text); ctx.refresh(); };
  const setConfirmed = (tag, on) => {
    state.uncheckedSkills = on ? state.uncheckedSkills.filter((t) => t !== tag) : [...state.uncheckedSkills, tag];
    ctx.refresh();
    document.getElementById(`confirm-${tag}`)?.focus();
  };

  // Suggestions: only skills we haven't already found or been given.
  const owned = new Set([...prof.skills, ...items.map((i) => i.tag)]);
  const suggestions = Object.entries(skillLabels).filter(([tag]) => !owned.has(tag)).map(([, label]) => label);
  const input = h("input", { id: "other-skill", autocomplete: "off", placeholder: "For example, welding, Spanish, or EPA 608" });

  return h("section", {},
    h("h2", {}, "Your skills, in civilian terms"),
    items.length ? h("p", {}, "Each line is tied to evidence from your record. Uncheck anything that doesn't sound like you, and it won't count toward your matches. Edit lines before using them on a resume.") : h("p", {}, "We couldn't find skills in this record. Add some below, or go back and add duties to your job."),
    h("ul", { class: "cards" }, items.map((i) => {
      const btn = h("button", { class: "secondary", onclick: async () => {
        await navigator.clipboard.writeText(i.line); btn.textContent = "Copied!"; setTimeout(() => (btn.textContent = "Copy"), 1500);
      } }, "Copy");
      return h("li", { class: i.confirmed ? "card" : "card unchecked" },
        h("label", { class: "confirm-skill" },
          h("input", { type: "checkbox", id: `confirm-${i.tag}`, checked: i.confirmed, onchange: (e) => setConfirmed(i.tag, e.target.checked) }),
          i.label),
        h("p", { class: "line" }, i.line),
        h("small", {}, `Evidence: “${i.evidence}” (${i.from}${i.inferred ? ", typical for this MOS — not in your record" : ""})`),
        i.confirmed ? btn : h("small", { class: "unchecked-note" }, "Not counted toward your matches."));
    })),

    h("div", { class: "add-skills" },
      h("h3", {}, "Add other skills"),
      h("p", {}, "Include anything your record misses: civilian jobs, hobbies, what you handle at home, languages, or certifications. Added skills count toward your matches when we recognize them."),
      h("form", { class: "add-row", onsubmit: (e) => { e.preventDefault(); addSkill(input.value); } },
        h("label", { for: "other-skill" }, "Skill or certification"),
        h("div", { class: "row" }, input, h("button", { type: "submit" }, "Add"))),
      suggestions.length ? h("div", {}, h("p", { class: "chips-label" }, "Or tap to add:"),
        h("div", { class: "chips" }, suggestions.map((s) => h("button", { type: "button", class: "chip", onclick: () => addSkill(s) }, `+ ${s}`)))) : null,
      prof.added.length ? h("ul", { class: "cards added" }, prof.added.map((a) => h("li", { class: "card" },
        h("strong", {}, a.text),
        h("p", { class: "line" }, a.line),
        h("small", {}, addedNote(a)),
        h("button", { class: "secondary", "aria-label": `Remove ${a.text}`, onclick: () => removeSkill(a.text) }, "Remove")))) : null),

    allLines.length ? copyAll : null,
    h("div", { class: "nav" }, h("button", { onclick: ctx.next }, "See my Opportunity Map")));
}
