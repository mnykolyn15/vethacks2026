import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { skillLabels } from "../translate.js";
import { credentials } from "../data/credentials.js";

function addedNote(a) {
  const counts = [...a.creds.map((c) => credentials[c].name), ...a.tags.map((t) => skillLabels[t])];
  if (!counts.length) return "Added by you. It's kept for your resume, but we can't match it to a role yet.";
  return `Added by you. Counts toward: ${counts.join(", ")}.${a.creds.length ? "" : " Add a specific example before using it on a resume."}`;
}

const GROUPS = [
  ["business", "Leadership and business skills", "The skills employers hire for, and what you did to earn them."],
  ["technical", "Technical skills", "Hands-on skills from your trade."]
];

export function skillsView(ctx) {
  const prof = profile();
  const items = prof.skillItems;

  const addSkill = (text) => {
    const t = text.trim();
    if (!t) return;
    const seen = state.extraSkills.some((x) => x.toLowerCase() === t.toLowerCase());
    if (!seen) state.extraSkills = [...state.extraSkills, t];
    ctx.refresh();
    document.getElementById("other-skill")?.focus();
  };
  const removeSkill = (text) => { state.extraSkills = state.extraSkills.filter((x) => x !== text); ctx.refresh(); };
  const setConfirmed = (id, on) => {
    state.uncheckedSkills = on ? state.uncheckedSkills.filter((x) => x !== id) : [...state.uncheckedSkills, id];
    ctx.refresh();
    document.getElementById(`confirm-${id}`)?.focus();
  };

  // Suggestions: only skills we haven't already found or been given.
  const owned = new Set([...prof.skills, ...items.map((i) => i.tag).filter(Boolean)]);
  const suggestions = Object.entries(skillLabels).filter(([tag]) => !owned.has(tag)).map(([, label]) => label);
  const input = h("input", { id: "other-skill", autocomplete: "off", placeholder: "For example, welding, Spanish, or EPA 608" });

  // One skill: what they did in the service, the corporate skill it shows, and how to say it.
  const card = (i) => {
    const copy = h("button", { class: "secondary", onclick: async () => {
      await navigator.clipboard.writeText(i.line); copy.textContent = "Copied!"; setTimeout(() => (copy.textContent = "Copy"), 1500);
    } }, "Copy");
    return h("li", { class: i.confirmed ? "card skill" : "card skill unchecked" },
      h("label", { class: "confirm-skill" },
        h("input", { type: "checkbox", id: `confirm-${i.id}`, checked: i.confirmed, onchange: (e) => setConfirmed(i.id, e.target.checked) }),
        h("span", {}, h("strong", {}, "Military skill: "), i.military)),
      h("p", { class: "skill-row" }, h("strong", {}, "Corporate skill: "), i.corporate),
      h("div", { class: "say" }, h("small", {}, "How to say it"), h("p", { class: "line" }, i.line)),
      i.inferred ? h("small", {}, `Typical for this code, not in your record (${i.from}). Keep it only if it's true for you.`) : h("small", {}, `From: ${i.from}`),
      i.confirmed ? copy : h("small", { class: "unchecked-note" }, "Not counted toward your matches."));
  };

  return h("section", {},
    h("h2", {}, "Your service, translated for employers"),
    items.length
      ? h("p", { class: "lead" }, "Here's what you did in the service, the corporate skill it shows, and how to say it. Uncheck anything that doesn't sound like you, and it won't count toward your matches.")
      : h("p", {}, "We couldn't find skills in this record. Add some below, or go back and add what you did to your job."),
    items.length ? h("p", { class: "hint" }, "Replace anything in [brackets] with your real numbers, and keep only what's true for you.") : null,
    GROUPS.map(([key, title, blurb]) => {
      const group = items.filter((i) => i.group === key);
      return group.length ? h("div", { class: "skill-group" }, h("h3", {}, title), h("p", { class: "hint" }, blurb), h("ul", { class: "cards" }, group.map(card))) : null;
    }),

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

    h("div", { class: "nav" }, h("button", { onclick: ctx.next }, "Next: where this can take you")));
}
