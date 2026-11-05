// ZIP code lookup (src/data/zips.json, built by scripts/build-zips.py from GeoNames; New Jersey for now).
// Entries use the same shape as the code search so the shared combobox can show them:
// code = ZIP, title = "Town, ST", branch = county line.
let loading = null;
let index = [];

export function prepare(data) {
  return data.rows.map(([zip, town, state, county, lat, lng]) => ({
    code: zip, title: `${town}, ${state}`, branch: `${county} County`, category: "", retired: false, lat, lng, text: town.toLowerCase()
  }));
}

export function loadZips() {
  loading ||= fetch(new URL("./zips.json", import.meta.url))
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => { index = prepare(data); return index.length; })
    .catch(() => 0);
  return loading;
}
export const useZipIndex = (entries) => { index = entries; }; // for tests

// Digits match the start of a ZIP; letters match the start of a town name (then anywhere in it).
export function searchZips(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (/^\d/.test(q)) return index.filter((e) => e.code.startsWith(q)).slice(0, limit);
  return [...index.filter((e) => e.text.startsWith(q)), ...index.filter((e) => !e.text.startsWith(q) && e.text.includes(q))].slice(0, limit);
}

export const findZip = (zip) => index.find((e) => e.code === String(zip).trim()) || null;
