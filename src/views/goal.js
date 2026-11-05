import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { rankHorizons, scoreRole, HORIZONS, HORIZON_ORDER } from "../matching.js";
import { careers } from "../data/careers.js";
import { skillLabels } from "../translate.js";

const usd = (n) => `$${Math.round(n / 1000)}k`;

// Every role, grouped by ring, for choosing a dream job. Used here and on the Opportunity Map.
export function dreamOptions(prof) {
  const all = careers.map((c) => scoreRole(c, prof));
  return [h("option", { value: "" }, "Choose a role"),
    ...HORIZON_ORDER.map((k) => h("optgroup", { label: `${HORIZONS[k].label} (${HORIZONS[k].span})` },
      all.filter((s) => s.horizon === k).sort((a, b) => a.role.title.localeCompare(b.role.title))
        .map((s) => h("option", { value: s.role.id }, s.role.title))))];
}

export function goalView(ctx) {
  const prof = profile();
  const groups = rankHorizons(prof);
  const clearFirst = (list) => [...list].sort((a, b) => a.blocked.length - b.blocked.length);
  const now = clearFirst(groups.earn).slice(0, 3);
  const ideas = clearFirst(groups.big).slice(0, 3);

  const select = h("select", { id: "goal-dream", onchange: (e) => (state.dream = e.target.value || null) }, dreamOptions(prof));
  select.value = state.dream || "";
  const note = h("textarea", { id: "goal-note", rows: 2, placeholder: "For example, running my own shop, or being home by 5", oninput: (e) => (state.dreamNote = e.target.value) }, state.dreamNote);

  return h("section", { class: "goal" },
    h("h2", {}, "Your skills can get you here now"),
    h("p", {}, "These are the closest matches you could start in about three months or less. Which one interests you most?"),
    now.length
      ? h("ul", { class: "goal-now" }, now.map((s) => h("li", {},
          h("label", { class: "goal-role" },
            h("input", { type: "radio", name: "first-job", value: s.role.id, checked: state.firstJob === s.role.id, onchange: () => (state.firstJob = s.role.id) }),
            h("span", {},
              h("strong", {}, s.role.title),
              h("small", {}, `${usd(s.role.pay.lo)}–${usd(s.role.pay.hi)}/yr (estimate) · about ${s.weeks} weeks`),
              h("small", {}, `Uses your skills in: ${s.matchedSkills.map((t) => skillLabels[t]).join(", ") || "none yet"}`),
              s.blocked.length ? h("small", { class: "goal-warn" }, `Doesn't fully fit your limits: ${s.blocked.join(", ").toLowerCase()}`) : null)))))
      : h("p", {}, "We don't have a close match you could start soon. Add skills in the last step, or adjust your limits, to open some up."),

    h("h2", {}, "Where do you want this to lead?"),
    h("p", {}, "There's no wrong answer, and you can change it later. We'll map the steps from your first paycheck to your goal."),
    h("label", { for: "goal-dream" }, "Your dream job"), select,
    ideas.length ? h("div", {}, h("p", { class: "chips-label" }, "Need ideas? These longer paths build on your skills:"),
      h("div", { class: "chips" }, ideas.map((s) => h("button", { type: "button", class: "chip", onclick: () => { state.dream = s.role.id; select.value = s.role.id; } }, s.role.title)))) : null,
    h("label", { for: "goal-note" }, "Anything else you want from your career? (optional)"), note,
    h("div", { class: "nav" },
      h("button", { onclick: ctx.next }, "See my Opportunity Map"),
      h("button", { class: "secondary", onclick: () => { state.dream = null; select.value = ""; ctx.next(); } }, "I'm not sure yet")));
}
