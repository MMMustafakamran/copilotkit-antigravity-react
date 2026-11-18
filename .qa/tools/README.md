# tools/

Shared tools (run from the repo root, from its synced `.qa/tools/`).

| Tool | Job | What it does |
|---|---|---|
| `drift.mjs` | local | Doc drift vs `doc-snapshot/`; holds changed pages ([DRIFT.md](../../instructions/DRIFT.md)). |
| `probe.mts` | local | Fast probe (AUTORECORDER.md §0): runs each page through the repo's engine in fast mode (`RecordingEngine(root, { fast: true }).probePage`), one process per page, so the page's own action and checkpoints decide. `--repeat N` (pass / fail / flaky), `--warm`, `--health` (down → `setup-failed`, exit 3), `--parallel`, `--headed`, `--prompt`, `--route`, `--wait`. Writes `videos/probe/<id>/{final.png,failure.png,result.json,probe.log}` and `videos/probe/summary.{json,md}`. |
