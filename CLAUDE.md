# VetHacks 2026 – Skills Translator

Static web app for the Veteran's Day hackathon ("veteran's build"). Veterans search for their military role (e.g. Army MOS `68W`) and get civilian job titles, transferable skills, and copyable resume bullets.

No build step, no dependencies, no AI/API keys. Plain HTML + ES modules.

## Setup (new machine)

Requirements: `git` and `python3` (preinstalled on macOS). Node is not needed.

```sh
git clone git@github.com:saanikak/vethacks2026.git
cd vethacks2026
python3 -m http.server 8000
```

Open http://localhost:8000. Stop the server with Ctrl+C.

- Cloning over SSH needs an SSH key added to your GitHub account (https://github.com/settings/ssh/new). Otherwise clone with `https://github.com/saanikak/vethacks2026.git`.
- Serve over HTTP rather than opening `index.html` directly: ES modules (`<script type="module">`) are blocked on `file://` URLs.
- If port 8000 is taken, use another, e.g. `python3 -m http.server 8001`.

## Layout

- `index.html` – page shell
- `src/app.js` – search, rendering, copy-to-clipboard
- `src/data.js` – the role dataset (`roles` array); add new MOS/ratings here
- `src/style.css` – styles

## Adding a role

Append an object to `roles` in `src/data.js` with: `code`, `title`, `branch`, `civilianRoles[]`, `skills[]`, `bullets[]`. Search matches code, title, civilian roles, and skills, so no other change is needed.

Current data is sample content (Army only) and should be fact-checked before demo.

## Workflow

- Branch: `main`, remote `origin` (github.com/saanikak/vethacks2026).
- Pull before you start (`git pull`) and push small commits often to avoid conflicts, especially in `src/data.js`.
- No tests or linter yet. Sanity-check JS with `node --check src/app.js` if Node is installed.
