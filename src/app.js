import { h } from "./dom.js";
import { state, jordan, defaultAnswers } from "./state.js";
import { intakeView } from "./views/intake.js";
import { questionnaireView } from "./views/questionnaire.js";
import { skillsView } from "./views/skills.js";
import { ringsView } from "./views/rings.js";
import { gapsView } from "./views/gaps.js";
import { mapView } from "./views/map.js";

const steps = [
  { label: "Upload", view: intakeView },
  { label: "Questions", view: questionnaireView, needs: () => state.jst },
  { label: "Skills", view: skillsView, needs: () => state.jst },
  { label: "Matches", view: ringsView, needs: () => state.jst && state.answersDone },
  { label: "Gaps", view: gapsView, needs: () => state.jst && state.answersDone },
  { label: "Help nearby", view: mapView }
];
let current = 0;
const root = document.getElementById("app");

function go(i) {
  current = Math.max(0, Math.min(steps.length - 1, i));
  render();
  window.scrollTo(0, 0);
}

function loadJordan() {
  state.jst = structuredClone(jordan.jst);
  state.answers = { ...defaultAnswers(), ...structuredClone(jordan.answers) };
  state.answersDone = true;
  state.selected = null;
  go(3);
}

function render() {
  const ctx = { next: () => go(current + 1), back: () => go(current - 1) };
  const nav = h("nav", { class: "steps", "aria-label": "Progress" }, steps.map((s, i) => {
    const locked = s.needs && !s.needs();
    return h("button", { class: i === current ? "step current" : "step", disabled: locked, "aria-current": i === current ? "step" : null, onclick: () => go(i) }, `${i + 1}. ${s.label}`);
  }));
  root.replaceChildren(
    h("header", {}, h("h1", {}, "Veterans Build America"),
      h("p", {}, "From your JST to career matches, gaps to close, one action this week, and help nearby."),
      h("button", { class: "demo", onclick: loadJordan }, "Load demo: Jordan Lee")),
    nav, h("main", {}, steps[current].view(ctx)));
}
render();
