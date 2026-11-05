import { h } from "../dom.js";
import { state, profile } from "../state.js";
import { rankRoles, scoreRole, weeklyAction } from "../matching.js";
import { careers } from "../data/careers.js";
import { credentials } from "../data/credentials.js";

export function gapsView(ctx) {
  const prof = profile();
  const { top } = rankRoles(prof, undefined, { apprenticeship: state.apprenticeship });
  const role = careers.find((c) => c.id === (state.selected || state.dream || state.firstJob || state.growJob)) || top?.role;
  if (!role) return h("section", {}, h("h2", {}, "Gaps"), h("p", {}, "No matches yet — go back and adjust your answers."));
  const s = scoreRole(role, prof);
  const action = weeklyAction(s, prof);
  const deadline = action.deadline.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return h("section", {},
    h("h2", {}, `Gaps for ${role.title}`),
    h("div", { class: "action" }, h("h3", {}, "Your one action this week (under 2 hours)"), h("p", { class: "big" }, action.text), h("small", {}, action.why),
      h("dl", { class: "action-plan" },
        h("div", {}, h("dt", {}, "Finish by"), h("dd", {}, deadline)),
        h("div", {}, h("dt", {}, "Backup plan"), h("dd", {}, action.backup)))),
    s.missing.length
      ? h("ul", { class: "cards" }, s.missing.map((id) => { const c = credentials[id]; return h("li", { class: "card" },
          h("strong", {}, c.name), h("div", {}, `Cost: ${c.cost} · Time: about ${c.weeks} weeks`),
          h("small", {}, `Likely funding: ${c.funding.join("; ")}`)); }))
      : h("p", {}, "You meet every credential requirement for this role. 🎉"),
    h("p", {}, h("small", {}, "Costs and times are estimates. Check current funding rules with an American Job Center or va.gov.")),
    h("div", { class: "nav" }, h("button", { class: "secondary", onclick: ctx.back }, "Back to Your target"), h("button", { onclick: ctx.next }, "Find in-person help")));
}
