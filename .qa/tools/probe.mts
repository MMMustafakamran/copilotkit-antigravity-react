/**
 * probe: the fast check. Runs each page through the repo's own recorder engine in fast mode:
 * the demo step only, with the page's own action and checkpoints, headless, no video, no doc
 * tour, IDE, Notepad or human pacing. Use it to explore pages, check findings and verify fixes;
 * record the full clip (npm run record) only once a page's result is final (AUTORECORDER.md §0).
 *
 * Run from a repo's autorecorder/ folder (servers up via start-all.sh):
 *   npx tsx ../.qa/tools/probe.mts <page-id> [<page-id> ...] [options]
 *   npx tsx ../.qa/tools/probe.mts --all                      every page not in SKIP_RECORDING
 * Options:
 *   --prompt "..."     override the page's prompt (one page only)
 *   --route path       override the route (one page only)
 *   --wait 300         cap on the page action, seconds (default 300)
 *   --parallel 3       pages at once (default 3); each page runs in its own process
 *   --repeat N         run every page N times: pass = all ok, fail = none, else flaky
 *   --warm             GET every demo route once first (errors ignored)
 *   --health           check frontend + backend(s) first; any down -> setup-failed, exit 3
 *   --headed           show the browser (embedded apps / iframes / canvas, e.g. MCP Apps)
 * Output: autorecorder/videos/probe/<page-id>/  final.png, failure.png (when anything failed),
 *         result.json {id, ok, secs, checks, reply, errorsOnScreen, consoleErrors, failedRequests},
 *         probe.log (the action's console); videos/probe/summary.json + summary.md.
 * Prints one line per page. Exit 0 all pass, 1 any fail/flaky, 2 nothing to probe, 3 setup failed.
 */
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cwd = process.cwd();
const ROOT = join(cwd, '..');
const imp = (p: string) => import(pathToFileURL(resolve(cwd, p)).href);

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string, d?: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
};
const valued = new Set(['prompt', 'route', 'wait', 'parallel', 'repeat', 'child']);
const ids: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) { if (valued.has(args[i].slice(2))) i++; continue; }
  ids.push(args[i]);
}

const { PAGES, SKIP_RECORDING = {} } = await imp('config/pages.config.ts');
const { PROJECT, demoUrlFor } = await imp('config/project.config.ts');
const outRoot = join(cwd, 'videos', 'probe');

/** --prompt / --route apply to the page as the engine sees it. */
function withOverrides(p: any): any {
  const prompt = opt('prompt');
  const route = opt('route');
  return {
    ...p,
    ...(prompt ? { prompt, prompts: undefined } : {}),
    ...(route ? { route, demoUrl: demoUrlFor(route) } : {}),
  };
}

// ---- child: one page, one run, through the engine in fast mode --------------------------------
const childId = opt('child');
if (childId) {
  const { RecordingEngine } = await imp('core/engine.ts');
  const p = PAGES.find((x: any) => x.id === childId);
  const engine = new RecordingEngine(ROOT, { fast: true, headed: flag('headed'), actionCapS: Number(opt('wait', '300')) });
  try {
    await engine.probePage(withOverrides(p));
  } finally {
    await engine.shutdown().catch(() => {});
  }
  process.exit(0); // the page action may still hold timers after an early stop
}

// ---- parent -------------------------------------------------------------------------------------
const PAR = Math.max(1, Number(opt('parallel', '3')));
const REPEAT = Math.max(1, Number(opt('repeat', '1')));
const pages = flag('all') ? PAGES.filter((p: any) => !SKIP_RECORDING[p.id]) : PAGES.filter((p: any) => ids.includes(p.id));
const unknown = ids.filter((i) => !PAGES.some((p: any) => p.id === i));
if (unknown.length) console.error(`unknown page id(s): ${unknown.join(', ')}`);
if (!pages.length) { console.error('nothing to probe'); process.exit(2); }
mkdirSync(outRoot, { recursive: true });

function writeSummary(summary: any): void {
  writeFileSync(join(outRoot, 'summary.json'), JSON.stringify(summary, null, 1));
  const md = [`# probe ${summary.at}`, '', summary.setup ? `setup: ${summary.setup}` : '', '', '| page | result | runs | secs | first problem |', '|---|---|---|---|---|'];
  for (const pg of summary.pages) {
    const bad = pg.runs.find((r: any) => !r.ok);
    md.push(`| ${pg.id} | ${pg.result} | ${pg.runs.map((r: any) => (r.ok ? 'ok' : 'x')).join(' ')} | ${pg.runs.map((r: any) => r.secs).join(' ')} | ${String(bad?.error ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 160)} |`);
  }
  writeFileSync(join(outRoot, 'summary.md'), md.join('\n') + '\n');
}

let setupWarn = '';
if (flag('health')) {
  const { checkServicesHealth } = await imp('core/diagnostics.ts');
  const down: string[] = [];
  const h = await checkServicesHealth();
  if (!h.frontendOk) down.push(`frontend ${PROJECT.frontendUrl}: ${h.frontendError}`);
  // A dead backend is only a warning: pages on it still run and show the real error
  // (e.g. a doc import that crashes the server on start). Only the frontend is fatal.
  const warn: string[] = [];
  if (!h.backendOk) warn.push(`backend ${PROJECT.backendUrl}: ${h.backendError}`);
  // Optional extra backends a repo may list in PROJECT.backends (URLs).
  for (const url of (PROJECT as any).backends ?? []) {
    const ok = await fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => r.status < 500, () => false);
    if (!ok) warn.push(`backend ${url}: no answer`);
  }
  if (warn.length) { setupWarn = warn.join('; '); for (const w of warn) console.log(`warning: ${w}`); }
  if (down.length) {
    console.log('setup-failed');
    for (const d of down) console.log(`  ${d}`);
    writeSummary({ at: new Date().toISOString(), result: 'setup-failed', setup: down.join('; '), pages: pages.map((p: any) => ({ id: p.id, runs: [], result: 'setup-failed' })) });
    process.exit(3);
  }
}

if (flag('warm')) {
  const { prewarmDemoRoutes } = await imp('core/prewarm.ts');
  await prewarmDemoRoutes(pages.map(withOverrides)).catch(() => {});
}

const self = fileURLToPath(import.meta.url);
const passThrough = [...(flag('headed') ? ['--headed'] : []), ...(['prompt', 'route', 'wait'] as const).flatMap((n) => (opt(n) ? [`--${n}`, opt(n)!] : []))];

/** One run of one page in its own process (the engine keeps per-take state in module scope). */
function runOnce(id: string, n: number): Promise<any> {
  const dir = join(outRoot, id);
  rmSync(join(dir, 'result.json'), { force: true }); // a child that dies early must not leave an old result
  return new Promise((res) => {
    const child = spawn(process.execPath, [...process.execArgv, self, '--child', id, ...passThrough], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (d) => chunks.push(d));
    child.stderr.on('data', (d) => chunks.push(d));
    child.on('close', (code) => {
      mkdirSync(dir, { recursive: true });
      const log = Buffer.concat(chunks);
      createWriteStream(join(dir, n > 1 ? `probe.${n}.log` : 'probe.log')).end(log);
      const file = join(dir, 'result.json');
      let r: any = null;
      try { r = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null; } catch {}
      res(r ?? { id, ok: false, secs: 0, checks: [], error: `probe process exited ${code} without a result: ${log.toString().trim().split('\n').slice(-3).join(' | ').slice(0, 300)}` });
    });
  });
}

const line = (id: string, result: string, runs: any[]) => {
  const last = runs[runs.length - 1];
  const what = last.ok ? (last.reply ?? '') : (last.error ?? '');
  console.log(`${result.padEnd(8)} ${String(last.secs).padStart(6)}s  ${id.padEnd(32)} ${runs.length > 1 ? `[${runs.map((r) => (r.ok ? 'ok' : 'x')).join(' ')}] ` : ''}${String(what).replace(/\s+/g, ' ').slice(0, 90)}`);
};

console.log(`probe: ${pages.length} page(s), ${PAR} at a time, ${PROJECT.frontendUrl}${REPEAT > 1 ? `, ${REPEAT} runs each` : ''}`);
const done: any[] = [];
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(PAR, queue.length) }, async () => {
  while (queue.length) {
    const p = queue.shift();
    const runs: any[] = [await runOnce(p.id, 1)];
    while (runs.length < REPEAT) runs.push(await runOnce(p.id, runs.length + 1));
    const oks = runs.filter((r) => r.ok).length;
    const result = oks === runs.length ? 'pass' : oks === 0 ? 'fail' : 'flaky';
    done.push({ id: p.id, runs, result });
    line(p.id, result, runs);
  }
}));
const order = new Map(pages.map((p: any, i: number) => [p.id, i]));
done.sort((a, b) => (order.get(a.id) as number) - (order.get(b.id) as number));
writeSummary({ at: new Date().toISOString(), ...(setupWarn ? { setup: `warning: ${setupWarn}` } : {}), result: done.every((d) => d.result === 'pass') ? 'pass' : 'fail', pages: done });
console.log(`evidence: ${outRoot}`);
process.exit(done.every((d) => d.result === 'pass') ? 0 : 1);
