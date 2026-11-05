import { roles } from "./data.js";

const search = document.getElementById("search");
const results = document.getElementById("results");
const detail = document.getElementById("detail");

function matches(role, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [role.code, role.title, ...role.civilianRoles, ...role.skills]
    .some((s) => s.toLowerCase().includes(q));
}

function renderResults() {
  const found = roles.filter((r) => matches(r, search.value));
  results.replaceChildren(...found.map((role) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = `${role.code} – ${role.title}`;
    btn.addEventListener("click", () => showDetail(role));
    li.append(btn);
    return li;
  }));
  if (!found.length) {
    const li = document.createElement("li");
    li.textContent = "No matches yet. Try a different term.";
    results.append(li);
  }
}

function list(title, items) {
  const h = document.createElement("h3");
  h.textContent = title;
  const ul = document.createElement("ul");
  ul.append(...items.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
  return [h, ul];
}

function showDetail(role) {
  const heading = document.createElement("h2");
  heading.textContent = `${role.title} (${role.branch} ${role.code})`;
  const copy = document.createElement("button");
  copy.textContent = "Copy resume bullets";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(role.bullets.map((b) => `• ${b}`).join("\n"));
    copy.textContent = "Copied!";
    setTimeout(() => (copy.textContent = "Copy resume bullets"), 1500);
  });
  detail.replaceChildren(
    heading,
    ...list("Civilian job titles", role.civilianRoles),
    ...list("Transferable skills", role.skills),
    ...list("Resume bullets", role.bullets),
    copy
  );
  detail.hidden = false;
  detail.scrollIntoView({ behavior: "smooth" });
}

search.addEventListener("input", renderResults);
renderResults();
