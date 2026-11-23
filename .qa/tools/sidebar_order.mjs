#!/usr/bin/env node
// Live docs sidebar, in visual order, with each page's real group path (owner 2026-11-23:
// report rows follow the live sidebar order). Run from a repo root:
//
//   node .qa/tools/sidebar_order.mjs [--base=https://docs.copilotkit.ai] [--out=doc-snapshot/sidebar-order.json]
//
// Opens <base>/<root> (root from assignment.json docBase, the same URL drift.mjs reads: it selects
// the frontend and the agent framework), expands every collapsed sidebar folder, then walks the
// sidebar DOM: <p> = section heading, a folder <div> holding a <button> = folder (nested folders
// nest), <a href> = page. Writes {root, savedAt, pages:[{url, name, group:[section, folder, ...]}]}
// in DOM order. Folders labelled by a page link only render their children on that page: each one
// is visited and its children spliced in after it. Only pages under the root are kept. Uses
// autorecorder/'s Playwright.
// Read by qa-kit/report/build.py; not a drift baseline (drift.mjs keeps doc-snapshot/sidebar.json).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, "").split("="); return [k, v.length ? v.join("=") : true]; }));
const ORIGIN = (args.base || "https://docs.copilotkit.ai").replace(/\/$/, "");
const OUT = args.out || path.join("doc-snapshot", "sidebar-order.json");
const assignment = JSON.parse(fs.readFileSync("assignment.json", "utf8"));
const ROOT = new URL(assignment.docBase).pathname.replace(/^\/|\/$/g, "");
const { chromium } = createRequire(path.resolve("autorecorder/package.json"))("playwright");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // Open a docs page, expand every <button> folder, then walk the sidebar. With `at` (a folder whose
  // label is a page link: <div data-open><a>label</a><div panel>...</div></div>), walk only that
  // folder's panel, which is open because we are on its page. Closed link folders are returned in
  // `pending`: their children render only on their own page.
  async function crawl(url, at) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('#nd-sidebar [data-id$="-viewport"] a[href]', { state: "attached", timeout: 30000 });
    await page.waitForTimeout(2500); // hydration: folder buttons do nothing before it
    for (let round = 0; round < 20; round++) {
      const n = await page.evaluate(() => {
        const bs = [...document.querySelectorAll('#nd-sidebar [data-id$="-viewport"] button[aria-expanded="false"]')];
        bs.forEach((b) => b.click());
        return bs.length;
      });
      if (!n) break;
      await page.waitForTimeout(600);
    }
    return page.evaluate((at) => {
      const vp = document.querySelector('#nd-sidebar [data-id$="-viewport"]') || document.querySelector("#nd-sidebar");
      const out = [], pending = [];
      let section = null;
      const txt = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
      const kids = (e) => [...e.children];
      function walk(el, folders) {
        for (const c of kids(el)) {
          if (c.tagName === "P") { section = txt(c) || null; continue; }
          if (c.tagName === "A" && c.getAttribute("href")) { out.push({ href: c.getAttribute("href"), name: txt(c), group: [section, ...folders].filter(Boolean) }); continue; }
          if (c.tagName === "BUTTON") continue;
          const k = kids(c).filter((x) => x.tagName !== "SPAN");
          const btn = k.find((x) => x.tagName === "BUTTON");
          if (btn && txt(btn)) { // folder labelled by a button
            for (const x of k) if (x !== btn) walk(x, [...folders, txt(btn)]);
            continue;
          }
          const lead = k[0];
          if (lead && lead.tagName === "A" && (c.hasAttribute("data-closed") || c.hasAttribute("data-open"))) { // folder labelled by its own page link
            const label = txt(lead), group = [section, ...folders].filter(Boolean);
            out.push({ href: lead.getAttribute("href"), name: label, group });
            if (k.length > 1) for (const x of k.slice(1)) walk(x, [...folders, label]);
            else pending.push({ href: lead.getAttribute("href"), group: [...group, label] });
            continue;
          }
          walk(c, folders);
        }
      }
      if (!at) { walk(vp, []); return { out, pending }; }
      const a = [...vp.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === at.href);
      const box = a && a.parentElement;
      if (!box) return { out, pending };
      section = at.group[0] || null;
      for (const x of kids(box).filter((x) => x !== a && x.tagName !== "SPAN")) walk(x, at.group.slice(1));
      return { out, pending };
    }, at || null);
  }
  let { out: raw, pending } = await crawl(`${ORIGIN}/${ROOT}`);
  const done = new Set();
  while (pending.length) {
    const at = pending.shift();
    if (done.has(at.href)) continue;
    done.add(at.href);
    if (!new URL(at.href, ORIGIN).pathname.startsWith(`/${ROOT}/`)) continue; // out-of-root folders: not ours
    const r = await crawl(new URL(at.href, ORIGIN).href, at);
    const i = raw.findIndex((x) => x.href === at.href);
    raw.splice(i + 1, 0, ...r.out);
    pending.push(...r.pending);
  }
  const cleanUrl = (u) => u.split("#")[0].split("?")[0].replace(/\.md$/, "").replace(/\/index$/, "").replace(/\/$/, "");
  const seen = new Set(), pages = [];
  for (const r of raw) {
    const url = cleanUrl(new URL(r.href, ORIGIN).pathname);
    if (!(url === `/${ROOT}` || url.startsWith(`/${ROOT}/`)) || seen.has(url)) continue;
    seen.add(url);
    pages.push({ url, name: r.name, group: r.group });
  }
  if (!pages.length) throw new Error("no sidebar links found (docs markup changed?)");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ root: ROOT, savedAt: new Date().toISOString().slice(0, 10), pages }, null, 1) + "\n");
  console.log(`${OUT}: ${pages.length} pages`);
} finally { await browser.close(); }
