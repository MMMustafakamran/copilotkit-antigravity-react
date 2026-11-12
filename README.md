# Antigravity-react: CopilotKit docs QA (Google Antigravity, React)

QA harness for the CopilotKit docs at https://docs.copilotkit.ai/google-antigravity. Every doc page gets a route in a real Next.js app with the doc's snippets pasted **verbatim**, backed by the doc's Python Antigravity agents, and a screen-recorded clip shows what happens when a user follows the page. Where the docs break, the clip shows the break and the defect is listed in [FINDINGS.md](FINDINGS.md). Nothing here fixes a doc defect; the only allowed edits are marked `HARNESS` (rules: `.qa/instructions/QA-RULES.md`).

Status: recorded 2026-11-04, findings logged. **The clips need re-recording** (the old recorder drew red outlines on the page). 15 pages tracked in [assignment.json](assignment.json), 14 reachable (✅ 10 · ⚠️ 1 · ❌ 3), 12 clips, all on Loom. Current report: [report/status.html](report/status.html).

## Layout

```
backend/                 Python agents (FastAPI + uvicorn, run with uv), one app per port 8040-8045
frontend/                Next.js app, one route per doc page; runtime at /api/copilotkit (3040)
reference/starter/       CopilotKit <> Google Antigravity starter template, for comparison
doc-snapshot/            rendered / .md snapshot of the docs (2026-11-04)
reference/showcase/      CopilotKit showcase source, used to confirm what a doc page leaves out
autorecorder/            clip recorder: cli.ts → core/engine.ts → actions/*.ts; config/*.config.ts; output videos/ (not committed)
assignment.json          per-page status, notes, findings, clip ids, Loom links
report/status.html       generated from assignment.json (paste-friendly, team Google Doc format)
FINDINGS.md              open doc defects (stable #N ids)
.qa/                     vendored shared tooling + rules (synced; don't edit here)
start-all.sh             starts every backend and the frontend on the harness ports
```

Ports: frontend **3040**; agents **8040** quickstart · **8041** interrupt · **8042** shared state · **8043** sub-agents · **8044** tool rendering · **8045** state rendering. Never 3000 / 8000. Antigravity-vue runs its own copy of the quickstart agent (8141) and doesn't need this repo.

## Run

```sh
# keys: backend/.env (GEMINI_API_KEY) and frontend/.env.local (AGENT_URL), see .env.example
(cd backend && uv sync)
npm ci --prefix frontend && npm ci --prefix autorecorder
./start-all.sh                       # logs in logs/
cd autorecorder
npm run doctor                       # must exit 0
npm run record:list
npm run record -- --pages=quickstart,frontend-tools
```
## How to review and report

- **A clip**: it should go doc → IDE (verbatim code) → demo, and for ❌/⚠️ also evidence (the faulty doc text drag-selected) → Notepad note. Nothing may be injected on the page.
- **A status**: ✅ works as documented, ⚠️ main feature works with a minor defect, ❌ main feature doesn't work as documented. If in doubt, ❌.
- **A finding**: add it to `FINDINGS.md` with its evidence (probe result, error text, frame). Format: QA-RULES section 5.
- **The report**: edit `assignment.json` (schema: `.qa/report/SCHEMA.md`), then rebuild. Don't hand-edit the HTML. Rows use the team doc's older Antigravity `status` style (`report.style`).

  ```sh
  python .qa/report/build.py assignment.json --out report/status.html
  # framework report for the team doc (needs a checkout of Antigravity-vue beside this repo)
  python .qa/report/build.py assignment.json ../Antigravity-vue/assignment.json --out Antigravity-status.html
  ```
