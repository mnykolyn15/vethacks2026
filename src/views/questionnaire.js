import { h } from "../dom.js";
import { state } from "../state.js";
import { freeTextSignals } from "../matching.js";

const interestOptions = {
  mechanical: "Fixing & building things", electrical: "Electrical & power", tech: "Computers & tech",
  people: "Helping people", medical: "Health & medical", leading: "Leading a team", logistics: "Planning & logistics",
  security: "Safety & security", outdoors: "Working outdoors", data: "Data & analysis"
};

export function questionnaireView(ctx) {
  const a = state.answers;
  const select = (key, opts) => h("select", { onchange: (e) => (a[key] = e.target.value) },
    Object.entries(opts).map(([v, l]) => h("option", { value: v, selected: a[key] === v }, l)));
  const check = (key, label) => h("label", { class: "inline" }, h("input", { type: "checkbox", checked: a[key], onchange: (e) => (a[key] = e.target.checked) }), label);
  const num = (key, props = {}) => h("input", { type: "number", min: 0, value: a[key], ...props, oninput: (e) => (a[key] = Number(e.target.value)) });
  const signals = h("p", { class: "status" });
  const updateSignals = () => {
    const s = freeTextSignals(a.freeText);
    signals.textContent = s.notes.length ? `We picked up: ${s.notes.join(", ")}` : "";
  };
  updateSignals();

  return h("section", {},
    h("h2", {}, "A few questions (about 3 minutes)"),
    h("fieldset", {}, h("legend", {}, "1. How do you like to work?"),
      h("label", {}, "Style", select("handsOn", { either: "Either", "hands-on": "Hands-on", desk: "Desk" })),
      h("label", {}, "Setting", select("setting", { either: "Either", indoors: "Indoors", outdoors: "Outdoors" })),
      h("label", {}, "People", select("social", { either: "Either", team: "On a team", solo: "Solo" }))),
    h("fieldset", {}, h("legend", {}, "2. What did you enjoy most in the service?"),
      Object.entries(interestOptions).map(([k, l]) => h("label", { class: "inline" },
        h("input", { type: "checkbox", checked: a.interests.includes(k), onchange: (e) => {
          a.interests = e.target.checked ? [...a.interests, k] : a.interests.filter((x) => x !== k);
        } }), l))),
    h("fieldset", {}, h("legend", {}, "3. Commute, shifts, family"),
      h("label", {}, "Farthest you'll commute (miles)", num("commuteMiles")),
      check("daysOnly", "Daytime hours only"), check("childcare", "I need reliable childcare hours"),
      h("label", {}, "Willing to relocate?", select("relocate", { no: "No", maybe: "Maybe", yes: "Yes" }))),
    h("fieldset", {}, h("legend", {}, "4. When must income start?"),
      h("label", {}, "First paycheck needed by", h("input", { type: "date", value: a.incomeBy, onchange: (e) => (a.incomeBy = e.target.value) }))),
    h("fieldset", {}, h("legend", {}, "5. Money"),
      h("label", {}, "Minimum pay ($/hour)", num("minPay", { step: "0.5" })),
      check("wantsPaidTraining", "I want paid training or an apprenticeship")),
    h("fieldset", {}, h("legend", {}, "6. Education appetite"),
      h("label", {}, "Willing to take classes?", select("education", { none: "No classes", short: "Short courses (up to ~3 months)", long: "Longer programs" })),
      h("label", {}, "Hours per week you can study", num("hoursPerWeek"))),
    h("fieldset", {}, h("legend", {}, "7. What are you looking for?"),
      h("textarea", { rows: 3, placeholder: "In your own words…", oninput: (e) => { a.freeText = e.target.value; updateSignals(); } }, a.freeText), signals),
    h("button", { onclick: () => { state.answersDone = true; ctx.next(); } }, "See my skills"));
}
