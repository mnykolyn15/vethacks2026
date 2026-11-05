import { h } from "./dom.js";
import { state, resetState, jordan, defaultAnswers } from "./state.js";
import { intakeView } from "./views/intake.js";
import { questionnaireView } from "./views/questionnaire.js";
import { skillsView } from "./views/skills.js";
import { targetView } from "./views/target.js";
import { gapsView } from "./views/gaps.js";
import { mapView } from "./views/map.js";

const steps = [
  { label: "Background", view: intakeView },
  { label: "Questions", view: questionnaireView, needs: () => state.jst },
  { label: "Skills", view: skillsView, needs: () => state.jst },
  { label: "Your target", view: targetView, needs: () => state.jst && state.answersDone },
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

// Jordan Lee, the made-up demo veteran: every step starts filled in, beginning at Step 1.
function loadJordan() {
  resetState();
  state.demo = true;
  state.jst = structuredClone(jordan.jst);
  state.answers = { ...defaultAnswers(), ...structuredClone(jordan.answers) };
  state.answersDone = true;
  state.location = jordan.location;
  state.extraSkills = [...jordan.extraSkills];
  Object.assign(state, structuredClone(jordan.target)); // first job, grow step, dream job, note, comparison
  go(0);
}

// Back to a blank start, to show the generic workflow.
function startOver() {
  resetState();
  go(0);
}

function render() {
  const ctx = { next: () => go(current + 1), back: () => go(current - 1), refresh: render };
  const nav = h("nav", { class: "steps", "aria-label": "Progress" }, steps.map((s, i) => {
    const locked = s.needs && !s.needs();
    return h("button", { class: i === current ? "step current" : "step", disabled: locked, "aria-current": i === current ? "step" : null, onclick: () => go(i) }, `${i + 1}. ${s.label}`);
  }));
  root.replaceChildren(
    h("header", {}, h("h1", {}, "Veterans Build America"),
      h("p", {}, "From your service record to your target, gaps to close, one action this week, and help nearby."),
      state.demo ? h("p", { class: "demo-banner" }, "Demo: Jordan Lee, a made-up veteran. Every step is filled in.") : null,
      h("div", { class: "header-actions" },
        h("button", { class: "demo", onclick: loadJordan }, "Load demo: Jordan Lee"),
        h("button", { class: "demo", onclick: startOver }, "Start over"))),
    nav, h("main", {}, steps[current].view(ctx)));
}
render();
