# VetHacks 2026 – Veterans Build America (MVP)

Static web app for the Veteran's Day hackathon ("veteran's build"). Flow, built around the made-up demo veteran Jordan Lee (Army generator repairer, MOS 91D, single parent, made-up Riverbend County NJ, $25/hr minimum):

1. Share a background: resume, JST, and/or a code (MOS, AFSC, or rate) on one page. Whatever is given is merged into one confirm form (job, pay grade, billets, tasks, courses, certifications)
2. Paged questionnaire (6 short pages). Each question has a Low/Medium/Strong "how much does this matter" control that weights the ranking
3. Skills translation: each card shows the military skill (what the person did), the corporate skill it shows, and how to say it (copy-ready; [X] placeholders are for the person's own numbers). Users can uncheck skills so they stop counting, and add skills from outside their record that count toward matches
4. Your goal: an encouragement message and a target diagram (You in the center, short-term starts in the middle ring, dream targets in the outer ring). "What sounds like you" dream themes help people who can't name a dream job; they can also pick any role or say "not sure yet"
5. Opportunity Map: three rings (Earn now 0–3 months, Short training 3–12 months, Big moves 1–4 years), role cards, compare any two roles (what fits / what's missing or risky), and a dream-job path (short-term job -> long-term skill building -> dream job)
6. Gaps for a role + one action this week (under 2 hours) with a deadline 7 days out and a backup plan
7. Map of in-person veteran employment help

No build step, no dependencies, no AI/API keys. Plain HTML + ES modules. Libraries load from CDNs at runtime: pdf.js, Tesseract.js, and Mammoth (file parsing, only when a file is uploaded) and Leaflet + OpenStreetMap tiles (map).

## Setup (new machine)

Requirements: `git` and `python3` (preinstalled on macOS). Node is not needed to run the app.

```sh
git clone git@github.com:saanikak/vethacks2026.git
cd vethacks2026
python3 serve.py
```

Open http://localhost:8000 and click **Load demo: Jordan Lee** to start at the Skills step with Jordan's data filled in.

- Cloning over SSH needs an SSH key added to your GitHub account (https://github.com/settings/ssh/new). Otherwise clone with `https://github.com/saanikak/vethacks2026.git`.
- Serve over HTTP rather than opening `index.html` directly: ES modules are blocked on `file://` URLs.
- `serve.py` is `http.server` plus a no-cache header, so edits show up on a normal refresh. Plain `python3 -m http.server 8000` also works, but then hard-refresh (Cmd+Shift+R) after changes.
- If port 8000 is taken, pass another: `python3 serve.py 8001`.
- To try the JST flow, click "No JST handy? Try the sample" on step 1, or upload `samples/jordan-lee-jst.pdf` (made-up data).

## Layout

- `index.html` – page shell; `src/app.js` – step router and the Jordan demo loader
- `src/matching.js` – scoring, ring placement, and the dream-job path (**start here**; weights and ring rules are exported constants)
- `src/translate.js` – the translation rules: what someone did -> corporate skill -> how to say it (the 18-row table from the Skills spec, plus technical skills); typical tasks per code; tags for user-added skills. To add or change a skill, edit one entry in `rules`
- `src/jst.js` – JST and resume text parsers and redaction (SSN/DoD ID/email/phone removed before parsing). Dates and credit recommendations are deliberately not kept
- `src/ui.js` – shared form pieces: `help` (the "?" bubble), `field`, `pills` (tap choices), `importance`, `tagList`
- `src/data/codes.json` – every MOS, AFSC, and rate (~12,000 codes, with the civilian jobs each lines up with). **Generated** by `scripts/build-codes.py`; don't hand-edit. Searched by `src/data/codeSearch.js`
- `src/data/military.js` – a small curated list of common codes with TYPICAL TASKS (used when a person gives no tasks), billets (with civilian equivalents), pay grades
- `src/data/links.js` – outside links (Stability Navigator URL goes here)
- `src/state.js` – shared state, default answers, Jordan's profile
- `src/data/dreams.js` – dream themes (groups of role ids) for the Your goal step
- `src/data/careers.js` – ~25 curated roles; `src/data/pathways.js` – each role's Opportunity Map copy, work style, and time estimate; `src/data/credentials.js` – credential cost/time/funding/first step; `src/data/places.js` – map places
- `src/views/*.js` – one file per step; `src/dom.js` – tiny `h()` element helper

## Updating the code list

`src/data/codes.json` comes from the DMDC military crosswalk published by the O*NET Resource Center (https://www.onetcenter.org/crosswalks.html, "Military Crosswalk" zip; the current build used the July 2024 edition). To refresh it, download and unzip that file, then:

```sh
python3 scripts/build-codes.py path/to/milx0724.csv
```

It keeps Army, Marine Corps, Air Force, Space Force, Navy, and Coast Guard codes; merges Air Force skill levels (3E032, 3E052 -> 3E0X2); marks retired codes; and drops qualifiers (ASI, SQI, SEI, NEC, billet codes). Check the data's license terms before redistributing it outside this project.

## Decisions (from the feature list)

- Job data: curated set of ~25 roles, not live data. Pay ranges and credential costs are illustrative estimates; verify before presenting as fact.
- Match score = 50% skills + 30% constraints (hours, distance, timing, pay, paid training, classes) + 20% interests. Roles under 30% are hidden.
- Importance: each question's Low/Medium/Strong sets its weight (1/2/3) inside the constraints and interests parts. A "Strong" question the role fails demotes it a ring (hours and pay start at Strong). "Need help now = yes" makes income timing Strong.
- Pay: users give both an hourly minimum and a yearly salary minimum. Each role is compared on one of them (`SALARIED` in `matching.js`).
- Commute: "go farther for a better job" adds 0/10/20/30 miles of flexibility.
- Answers shape: see `defaultAnswers` in `state.js`. Questionnaire choices map to interest tags in `WORK_TAGS` / `MOMENT_TAGS` in `matching.js`.
- Opportunity Map rings are based on time, not score: with nothing missing, time = the role's `baseWeeks`; with a credential missing, time = its `months` in `pathways.js`. Up to 3 months = Earn now, up to 12 = Short training, longer = Big moves. Max 8 roles per ring, best match first.
- The internal strong/stretch/reach `ring` value is still computed in `scoreRole`. It decides which roles are shown and the default role on the Gaps step.
- Dream path: the dream job always comes from the person, never a preset, including in the demo. First job = the role they chose on the goal step; otherwise the Earn now role that fits the hours and pay limits and has the best skill overlap with the dream job plus match score.
- Map coverage: New Jersey only. Riverbend County isn't a real place, so the demo map labels it as made up and keeps its sample pins at real NJ coordinates.

## Known gaps / TODO

- `src/data/places.js` holds SAMPLE placeholder entries (no real addresses or phone numbers). Replace with records from the official VA facility locator (VA Lighthouse Facilities API, needs a key) and the DOL American Job Center directory (CareerOneStop).
- JST and resume parsing are heuristic. They were only tested on made-up documents (including `samples/jordan-lee-jst.pdf`), not a real JST, whose layout may differ. If a real JST parses badly, adjust the patterns in `src/jst.js`. The confirm step exists because parsing will make mistakes.
- Typical tasks exist only for the ~100 codes in `src/data/military.js`. Every other code falls back to its title plus the civilian jobs O*NET links to it (labelled "typical"), which gives weaker skills. Add entries to `military.js` for codes you expect in the demo.
- Codes are not unique across services (EM is both Navy and Coast Guard; 91D has a current and a retired meaning), so search shows the branch and flags retired codes and lets the person pick.
- `STABILITY_NAVIGATOR_URL` in `src/data/links.js` is empty. Until it's filled in, the "need help now" note shows without a link.
- Questionnaire: "contract based" and "part-time while I train" hours are collected but not scored yet, and role data has no pace or site info, so pace and "same site vs different sites" are inferred in `matching.js`.
- Privacy: files are read in the browser and discarded; nothing is uploaded or stored. Keep it that way.

## Workflow

- Branch: `main`, remote `origin` (github.com/saanikak/vethacks2026).
- Pull before you start (`git pull`) and push small commits often to avoid conflicts, especially in the `src/data/` files.
- No test suite yet. Quick logic check with Node: import `src/state.js`, `src/translate.js`, `src/matching.js` and call `rankRoles(...)` for Jordan's profile.
