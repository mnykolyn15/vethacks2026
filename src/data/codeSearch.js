// Search over every MOS, AFSC, and rate (src/data/codes.json, built by scripts/build-codes.py from the DMDC crosswalk).
// Falls back to the small curated list in military.js if the file can't be loaded.
import { codes as curated, normalizeCode } from "./military.js";

const CATEGORY = { E: "Enlisted", W: "Warrant officer", O: "Officer" };
let loading = null;
let index = [];

// Turn the compact file format into searchable entries.
export function prepare(data) {
  return data.rows.map(([svc, code, title, mpc, retired, onets]) => ({
    code, title, branch: data.services[svc], category: CATEGORY[mpc] || "", retired: !!retired,
    civilian: onets.map((o) => data.onet[o]).filter(Boolean),
    text: title.toLowerCase()
  }));
}

const fallback = () => curated.map((c) => ({ code: c.code, title: c.title, branch: c.branch, category: "", retired: false, civilian: [], text: c.title.toLowerCase() }));

export function loadCodes() {
  loading ||= fetch(new URL("./codes.json", import.meta.url))
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => { index = prepare(data); return index.length; })
    .catch(() => { index = fallback(); return 0; });
  return loading;
}
export const useIndex = (entries) => { index = entries; }; // for tests

// Best matches first: exact code, then code prefix, then every word of the query found in the title.
export function searchCodes(query, limit = 8) {
  const q = query.trim();
  if (!q) return [];
  const list = index.length ? index : fallback();
  const code = normalizeCode(q);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = [];
  for (const e of list) {
    let score = 0;
    if (e.code === code) score = 100;
    else if (code.length >= 2 && e.code.startsWith(code) && !/\s/.test(q)) score = 60;
    else if (words.length && words.every((w) => e.text.includes(w))) score = 30 + (e.text.startsWith(words[0]) ? 5 : 0);
    if (!score) continue;
    scored.push([score - (e.retired ? 15 : 0) - (e.category === "Enlisted" ? 0 : 1), e]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].title.length - b[1].title.length).slice(0, limit).map(([, e]) => e);
}

// The best single match for a typed code, preferring the branch we already know and current (not retired) codes.
export function findCode(raw, branch = "") {
  const code = normalizeCode(raw || "");
  if (!code) return null;
  const hits = (index.length ? index : fallback()).filter((e) => e.code === code);
  return [...hits].sort((a, b) => (b.branch === branch) - (a.branch === branch) || a.retired - b.retired)[0] || null;
}
