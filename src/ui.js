// Small form components shared by the Background and Questions steps.
import { h } from "./dom.js";

let uid = 0;
export const nextId = (prefix = "f") => `${prefix}-${++uid}`;

// "?" bubble that shows a tip when tapped. Returns [button, tip]: put the button next to a label and the tip under it.
export function help(text) {
  const tip = h("div", { class: "help-tip", role: "note", hidden: true }, text);
  const btn = h("button", { type: "button", class: "help", "aria-label": "Show an example", "aria-expanded": "false", onclick: () => {
    tip.hidden = !tip.hidden;
    btn.setAttribute("aria-expanded", String(!tip.hidden));
  } }, "?");
  return [btn, tip];
}

// A labelled form row: label, optional "?" tip, then the control.
export function field(label, control, tip, { forId } = {}) {
  const [btn, pop] = tip ? help(tip) : [null, null];
  return h("div", { class: "field" },
    h("div", { class: "label-row" }, h("label", forId ? { for: forId } : {}, label), btn), pop, control);
}

// Tap-to-toggle choices. `options` are [value, label, hint?]. `exclusive` values clear every other choice when picked
// (like "No preference"). `max` stops more than that many being chosen.
export function pills({ options, selected = [], max = Infinity, exclusive = [], single = false, onchange, label }) {
  let sel = [...selected];
  const buttons = new Map();
  const wrap = h("div", { class: "pills", role: "group", "aria-label": label });
  const note = h("p", { class: "pill-note", role: "status" });
  const draw = () => {
    const full = sel.length >= max;
    for (const [value, b] of buttons) {
      const on = sel.includes(value);
      b.setAttribute("aria-pressed", String(on));
      b.disabled = full && !on;
    }
    note.textContent = Number.isFinite(max) ? `${sel.length} of ${max} chosen` : "";
  };
  for (const [value, text, hint, tag] of options) {
    const b = h("button", { type: "button", class: "pill", onclick: () => {
      if (sel.includes(value)) sel = sel.filter((v) => v !== value);
      else if (single || exclusive.includes(value)) sel = [value];
      else sel = [...sel.filter((v) => !exclusive.includes(v)), value];
      draw();
      onchange?.([...sel]);
    } }, h("strong", {}, text), hint ? h("small", {}, hint) : null, tag ? h("span", { class: "pill-tag" }, tag) : null);
    buttons.set(value, b);
    wrap.append(b);
  }
  draw();
  return h("div", {}, wrap, Number.isFinite(max) ? note : null);
}

// Low / Medium / Strong: how much this question should count when roles are ranked.
export function importance(value, onchange) {
  let cur = value || "medium";
  const btns = {};
  const draw = () => Object.entries(btns).forEach(([k, b]) => b.setAttribute("aria-pressed", String(k === cur)));
  const row = h("div", { class: "importance" },
    h("span", {}, "How much does this matter?"),
    h("div", { class: "seg", role: "group", "aria-label": "How much does this matter?" },
      [["low", "Low"], ["medium", "Medium"], ["strong", "Strong"]].map(([k, l]) => {
        btns[k] = h("button", { type: "button", onclick: () => { cur = k; draw(); onchange(k); } }, l);
        return btns[k];
      })));
  draw();
  return row;
}

// A list of short items the person can add to and remove from, with optional tap-to-add suggestions.
// `note(item)` can return a small extra line for an item (for example a civilian job title).
// With `inlineSuggestions: false`, place `sugEl` (the tap-to-add chips) somewhere else yourself.
export function tagList({ items = [], label, placeholder, note, onchange, inlineSuggestions = true }) {
  let list = [...items];
  let suggestions = [];
  const id = nextId("tag");
  const ul = h("ul", { class: "tags" });
  const sug = h("div", { class: "chips" });
  const input = h("input", { id, "aria-label": label, placeholder, autocomplete: "off" });
  const draw = () => {
    ul.replaceChildren(...list.map((t) => h("li", {},
      h("span", {}, t, note?.(t) ? h("small", {}, note(t)) : null),
      h("button", { type: "button", class: "x", "aria-label": `Remove ${t}`, onclick: () => { list = list.filter((x) => x !== t); draw(); onchange?.([...list]); } }, "×"))));
    const open = suggestions.filter((s) => !list.some((x) => x.toLowerCase() === s.toLowerCase()));
    sug.replaceChildren(...open.map((s) => h("button", { type: "button", class: "chip", onclick: () => add(s) }, `+ ${s}`)));
    sug.hidden = !open.length;
  };
  const add = (text) => {
    const t = text.trim();
    if (t && !list.some((x) => x.toLowerCase() === t.toLowerCase())) list.push(t);
    draw();
    onchange?.([...list]);
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(input.value); input.value = ""; } });
  const el = h("div", { class: "taglist" }, ul,
    h("div", { class: "add-row-inline" }, input, h("button", { type: "button", class: "secondary", onclick: () => { add(input.value); input.value = ""; input.focus(); } }, "Add")),
    inlineSuggestions ? sug : null);
  draw();
  return { el, sugEl: sug, get: () => [...list], add, setSuggestions: (s) => { suggestions = s; draw(); } };
}

const CATEGORY_NOTE = { Enlisted: "", "Warrant officer": "Warrant officer", Officer: "Officer" };

// A text box that suggests matches as you type. `search(text)` returns entries shaped like
// { code, title, branch, category, retired }; `onpick(entry)` runs when one is chosen.
export function combobox({ id, value = "", placeholder, search, onpick, label }) {
  const listId = `${id}-list`;
  const input = h("input", { id, role: "combobox", "aria-autocomplete": "list", "aria-controls": listId, "aria-expanded": "false",
    "aria-label": label, autocomplete: "off", placeholder, value });
  const list = h("ul", { id: listId, class: "combo-list", role: "listbox", hidden: true });
  let items = [];
  let active = -1;
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const pick = (entry) => { input.value = entry.code; close(); onpick?.(entry); };
  const draw = () => {
    list.replaceChildren(...items.map((e, i) => h("li", { role: "option", id: `${id}-opt-${i}`, class: i === active ? "active" : "", "aria-selected": String(i === active),
      onmousedown: (ev) => { ev.preventDefault(); pick(e); } },
      h("strong", {}, e.code), " ", e.title,
      h("small", {}, [e.branch, CATEGORY_NOTE[e.category], e.retired ? "retired code" : ""].filter(Boolean).join(" · ")))));
    list.hidden = !items.length;
    input.setAttribute("aria-expanded", String(!list.hidden));
    if (active >= 0) input.setAttribute("aria-activedescendant", `${id}-opt-${active}`); else input.removeAttribute("aria-activedescendant");
  };
  input.addEventListener("input", () => { items = search(input.value); active = -1; draw(); });
  input.addEventListener("focus", () => { if (input.value.trim() && !items.length) { items = search(input.value); draw(); } });
  input.addEventListener("blur", close);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && items.length) { e.preventDefault(); active = (active + 1) % items.length; draw(); }
    else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); active = (active - 1 + items.length) % items.length; draw(); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Escape") close();
  });
  return { el: h("div", { class: "combo" }, input, list), input };
}
