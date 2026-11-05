import { h } from "../dom.js";
import { profile } from "../state.js";

export function skillsView(ctx) {
  const items = profile().skillItems;
  const copyAll = h("button", { class: "secondary", onclick: async () => {
    await navigator.clipboard.writeText(items.map((i) => `• ${i.line}`).join("\n"));
    copyAll.textContent = "Copied!"; setTimeout(() => (copyAll.textContent = "Copy all lines"), 1500);
  } }, "Copy all lines");
  return h("section", {},
    h("h2", {}, "Your skills, in civilian terms"),
    items.length ? h("p", {}, "Each line is tied to evidence from your record. Edit before using it on a resume.") : h("p", {}, "We couldn't find skills in this record. Go back and add duties to your job."),
    h("ul", { class: "cards" }, items.map((i) => {
      const btn = h("button", { class: "secondary", onclick: async () => {
        await navigator.clipboard.writeText(i.line); btn.textContent = "Copied!"; setTimeout(() => (btn.textContent = "Copy"), 1500);
      } }, "Copy");
      return h("li", { class: "card" }, h("strong", {}, i.label),
        h("p", { class: "line" }, i.line),
        h("small", {}, `Evidence: “${i.evidence}” (${i.from}${i.inferred ? ", typical for this MOS — not in your record" : ""})`), btn);
    })),
    items.length ? copyAll : null,
    h("div", { class: "nav" }, h("button", { onclick: ctx.next }, "See my career matches")));
}
