# VetHacks 2026 – Veterans Build America (MVP)

Static web app for the Veteran's Day hackathon ("veteran's build"). Flow, built around the made-up demo veteran Jordan Lee (Army generator repairer, single parent, northern NJ):

1. Upload a JST (PDF/photo, or paste text) and confirm what was extracted
2. 7-question questionnaire (work style, interests, constraints, money/timing, education, free text)
3. Civilian skills translation with copy-ready resume lines tied to evidence
4. Career matches in three rings (strong fit / stretch / reach) with a visible scoring rule
5. Gaps for a role + one action this week (under 2 hours)
6. Map of in-person veteran employment help

No build step, no dependencies, no AI/API keys. Plain HTML + ES modules. Libraries load from CDNs at runtime: pdf.js and Tesseract.js (JST parsing, only when a file is uploaded) and Leaflet + OpenStreetMap tiles (map).

## Setup (new machine)

Requirements: `git` and `python3` (preinstalled on macOS). Node is not needed to run the app.

```sh
git clone git@github.com:saanikak/vethacks2026.git
cd vethacks2026
python3 -m http.server 8000
```

Open http://localhost:8000 and click **Load demo: Jordan Lee** to jump straight to the matches.

- Cloning over SSH needs an SSH key added to your GitHub account (https://github.com/settings/ssh/new). Otherwise clone with `https://github.com/saanikak/vethacks2026.git`.
- Serve over HTTP rather than opening `index.html` directly: ES modules are blocked on `file://` URLs.
- If port 8000 is taken, use another, e.g. `python3 -m http.server 8001`.
- The browser caches static files aggressively with this server. If a change doesn't show up, hard-refresh (Cmd+Shift+R).

## Layout

- `index.html` – page shell; `src/app.js` – step router and the Jordan demo loader
- `src/matching.js` – scoring and ring placement (**start here**; weights and ring rules are exported constants)
- `src/translate.js` – duty text -> civilian skill + resume line; MOS fallback duties
- `src/jst.js` – JST text parser and redaction (SSN/DoD ID/email removed before parsing)
- `src/state.js` – shared state, default answers, Jordan's profile
- `src/data/careers.js` – ~25 curated roles; `src/data/credentials.js` – credential cost/time/funding/first step; `src/data/places.js` – map places
- `src/views/*.js` – one file per step; `src/dom.js` – tiny `h()` element helper

## Decisions (from the feature list)

- Job data: curated set of ~25 roles, not live data. Pay ranges and credential costs are illustrative estimates; verify before presenting as fact.
- Ring scoring: score = 50% skills + 30% constraints (hours, distance, timing, pay, paid training, classes) + 20% interests. Strong = no missing credentials and score >= 60%. Stretch = <= 2 missing credentials and score >= 45%. Reach = score >= 30%. Failing a hard constraint (hours or pay) moves a role out one ring. Max 5 roles per ring.
- Map coverage: New Jersey only.

## Known gaps / TODO

- `src/data/places.js` holds SAMPLE placeholder entries (no real addresses or phone numbers). Replace with records from the official VA facility locator (VA Lighthouse Facilities API, needs a key) and the DOL American Job Center directory (CareerOneStop).
- JST parsing is heuristic and was only tested on made-up sample text, not a real JST. The confirm step exists because parsing will make mistakes.
- Privacy: files are read in the browser and discarded; nothing is uploaded or stored. Keep it that way.

## Workflow

- Branch: `main`, remote `origin` (github.com/saanikak/vethacks2026).
- Pull before you start (`git pull`) and push small commits often to avoid conflicts, especially in the `src/data/` files.
- No test suite yet. Quick logic check with Node: import `src/state.js`, `src/translate.js`, `src/matching.js` and call `rankRoles(...)` for Jordan's profile.
