import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig, type ActionContext } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion, AgentSilentError } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { glideClick, glideTo } from './glide-click';
import { runStandardAction } from '../core/actions';
import { type DocEvidence, showFinding } from './doc-evidence';
import { checkpoint, mark, probeText } from '../core/timeline';
import { registerDocEvidence } from '../core/doc-evidence';

/**
 * Finding clips: back to the doc, drag-select each cited text like a person, then the finding
 * typed into Notepad in casual words (REPOS.md Rule 6). No boxes or labels drawn on the page.
 */
export const FINDING_NOTES: Record<string, string> = {
  'threads-drawer': [
    "page says select new conversation then select the first thread and the chat shows its history again",
    "drawer lists the new thread and new conversation clears the chat,but clicking the thread back the chat just stays empty",
    "no history replays,the headless threads page replays the same thread on the same runtime fine",
    "page shows no runtime code at all,only a signup link,so i used the headless page server.ts with intelligence",
  ].join('\n'),
  components: [
    "page says already have copilotkit running, do step 3 only, runtime needs no change",
    "asked to compare starter team and enterprise plans, no standardui component renders, just text",
    "the only setup on the page is a tanstack openai builtinagent, not antigravity",
    "so with the existing antigravity agent, do step 3 only, nothing renders",
  ].join('\n'),
  'clf-reasoning-messages': [
    "page says reasoning models emit reasoning tokens and copilotkit shows them in the chat",
    "ran it, chat answers fine but no reasoning message ever shows up, just the plain reply",
    "backend reasoning.py takes reasoning_model and builds from agents._common",
    "that module isnt published anywhere so u dont know which model to use",
  ].join('\n'),
  reasoning: [
    "reasoning page says the agents thinking shows up as a reasoning block",
    "with the antigravity agent the chat replies in plain text, no reasoning block renders",
    "usereasoningcustomsuggestions is imported but never defined, only the default hook is shown",
    "backend reasoning.py needs reasoning_model from agents._common, not published",
  ].join('\n'),
  'a2ui': [
    "a2ui page says the frontend renders the agents schema as cards rows columns badges",
    "asked for a sales kpi dashboard, no dashboard shows up",
    "agent just errors out,sometimes a catalog error sometimes a bunch of render calls,or it dumps raw json in the chat",
    "page sends u to dynamic schema for the catalog and agent and that setup doesnt render either",
  ].join('\n'),
  'a2ui-styling': [
    "styling page says a2ui surfaces get themed with the css vars",
    "asked for a united flight sfo to jfk, a card shows but its empty",
    "no airline no airports no price,only the title and book button so theres nothing styled to see",
    "same fixed schema setup the page builds on,data never gets bound",
  ].join('\n'),
  'a2ui-advanced': [
    "advanced page says a secondary llm builds the ui and ur progress component shows meanwhile",
    "asked for a sales kpi dashboard, no dashboard shows",
    "chat shows a2ui render error cannot read properties of undefined reading map",
    "same dynamic schema setup the page builds on,it breaks the same way",
  ].join('\n'),
  'a2ui-dynamic-schema': [
    "dynamic schema page says thats all the default path needs",
    "asked for a sales kpi dashboard, no dashboard shows and the chat shows an a2ui render error",
    "the error says cannot read properties of undefined reading map",
    "my code is exactly like the page so the doc setup itself breaks",
  ].join('\n'),
  'a2ui-fixed-schema': [
    "fixed schema page says bound props are resolved against the data model",
    "asked for a united flight sfo to jfk, the card shows up but its empty",
    "no airline, no airports, no price, only the flight details title and the book button",
    "so the data never gets bound to the card",
  ].join('\n'),
  'gui-surfaces': [
    "surfaces page says the agent fills the featured products row",
    "agent calls render_ui but nothing renders, not in the page target and not in the chat",
    "console says no renderer is registered for render_ui",
    "page imports ./catalog shopui but never shows it, i copied it from the catalogs page",
  ].join('\n'),
  'gui-catalogs': [
    "catalogs page says pass ur catalog and the agent renders those components",
    "asked for 2 running shoes as product cards, the reply just stays empty",
    "with the existing antigravity agent no catalog component renders",
    "the page has no antigravity agent setup at all, same as the components and surfaces page",
  ].join('\n'),
  'gui-standard-catalog': [
    "standard catalog page says standardui gives u ready made components",
    "asked to compare starter team and enterprise in a table, the agent gave a plain markdown table",
    "no standard component renders, and the page never names the antigravity agent",
    "i added the agent id myself to get this far",
  ].join('\n'),
  'gui-state-and-actions': [
    "state and actions page says u get a product card with cart state and add to cart",
    "asked for the trail runner card, no card ever shows up, the reply is empty or the run fails",
    "so the cart and the action cant be tried at all",
    "page has no antigravity agent setup, same as components and surfaces, so nothing renders",
  ].join('\n'),
  'gui-theming': [
    "theming page says these a2ui colors style the generated ui",
    "asked for a card with a subscribe button, the reply is empty and nothing renders",
    "render_ui has no renderer so the theme never shows up on anything",
    "the page never names the antigravity agent either",
  ].join('\n'),
  'gui-transports': [
    "transports page says ur agent must use the tools and context of the run",
    "asked for the plans table, no generated ui shows up, just plain text or a failed run",
    "the only setup given is for langgraph with copilotkitmiddleware, nothing for an antigravity agent",
    "so the antigravity side is missing and no ui gets streamed",
  ].join('\n'),
  'gui-markdown-mode': [
    "markdown mode page says any other agent just needs the context in its system prompt",
    "asked for a seat estimator with a slider, no a2ui block shows up, the reply is empty or text, and once it wrote html files",
    "the page doesnt say how to put the context into an antigravity agent",
    "so the markdown mode step cant be followed as written",
  ].join('\n'),
  'gui-from-a2ui': [
    "adopt from a2ui page says the airport and arrow components render in the chat",
    "asked for my flight sfo to jfk, the reply is empty or the run fails, no airport or arrow ui shows",
    "render_ui gives nothing on antigravity, same as the components and surfaces page",
  ].join('\n'),
};

export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  'threads-drawer': [
    { text: 'Select "New Conversation", then select the first thread. The chat', caption: 'Reopening the thread replays nothing (FINDINGS.md #103)' },
  ],
  components: [
    { text: 'Already have CopilotKit running? Do step 3 only.', caption: 'Step 3 alone renders no component on Antigravity (FINDINGS.md #42)' },
  ],
  'clf-reasoning-messages': [
    { text: 'Some models (like gpt-6-luna) emit reasoning tokens', caption: 'Promises reasoning; the Code tab backend needs the unpublished agents._common.REASONING_MODEL (FINDINGS.md #61)' },
    { text: 'const AGENT_ID = "reasoning-default";', caption: 'Agent backed by reasoning.py, which needs agents._common' },
  ],
  reasoning: [
    { text: 'useReasoningCustomSuggestions();', caption: 'Never defined: the only suggestions.ts shown defines the default hook (FINDINGS.md #64)' },
    { text: 'const AGENT_ID = "reasoning-custom";', caption: 'Backed by reasoning.py, which needs the unpublished agents._common.REASONING_MODEL' },
  ],
  'a2ui': [
    { text: 'renders that schema as cards, rows, columns, badges', caption: 'No dashboard renders; agent errors out or dumps JSON (FINDINGS.md #103)' },
  ],
  'a2ui-styling': [
    { text: 'A2UI surfaces support theming through CSS custom properties', caption: 'Flight card renders empty, nothing to theme (FINDINGS.md #104)' },
  ],
  'a2ui-advanced': [
    { text: 'a secondary LLM generates the UI schema and data', caption: 'A2UI render error reading map, no dashboard (FINDINGS.md #105)' },
  ],
  'a2ui-dynamic-schema': [
    { text: 'That is all the default path needs.', caption: 'Wired as shown; A2UI render error instead of a dashboard (FINDINGS.md #72)' },
  ],
  'a2ui-fixed-schema': [
    { text: 'binder resolves each path before your renderer runs', caption: 'Card renders but no bound value shows (FINDINGS.md #73)' },
  ],
  'gui-surfaces': [{ text: "fallback={<ProductRow products={products} />}", caption: 'render_ui has no renderer (FINDINGS.md #87)' }],
  'gui-catalogs': [{ text: "generativeUI={{ ui: shopUI }}", caption: 'no Antigravity agent setup on the page (FINDINGS.md #89)' }],
  'gui-standard-catalog': [{ text: "generativeUI={{ ui: standardUI }}", caption: 'render_ui has no renderer (FINDINGS.md #90)' }],
  'gui-state-and-actions': [{ text: "state: { cart: cartSchema },", caption: 'render_ui has no renderer (FINDINGS.md #91)' }],
  'gui-theming': [{ text: "\"--a2ui-color-accent\": \"#d97706\",", caption: 'render_ui has no renderer (FINDINGS.md #94)' }],
  'gui-transports': [{ text: "For a LangGraph Python agent, add CopilotKitMiddleware.", caption: 'render_ui has no renderer (FINDINGS.md #95)' }],
  'gui-markdown-mode': [{ text: "Any other agent needs one thing: put the run's context entries into its system prompt.", caption: 'render_ui has no renderer (FINDINGS.md #97)' }],
  'gui-from-a2ui': [{ text: "generativeUI={{ ui: appUI }}", caption: 'render_ui gives nothing on Antigravity (FINDINGS.md #99)' }],
};

/**
 * Level 2 pages (QA-RULES §8a): already reported in the team doc and failing the same way.
 * Short clip: the take ends after the demo (no doc highlight, no Notepad).
 */
export const KNOWN_ISSUE = new Set<string>([]);

// Doc step highlight (core/doc-evidence): runs before the IDE, not after the demo. Must come after
// KNOWN_ISSUE (const), hence here.
registerDocEvidence(FINDING_EVIDENCE, { skip: KNOWN_ISSUE });

/** Type a page's finding into Notepad at the end of its take, after showing it on the doc. */
export async function writeFinding(page: Page, id: string, config?: PageRecordConfig): Promise<void> {
  if (!FINDING_NOTES[id] || !config) return;
  if (KNOWN_ISSUE.has(id)) return;
  await showFinding(page, config, FINDING_EVIDENCE[id], FINDING_NOTES[id]);
}

/** The standard prompt-and-reply take, then the finding in Notepad. */
export const runStandardWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    // A failed take still gets its explanation.
    await writeFinding(page, config.id, config);
  }
};

/**
 * Page actions for Google Antigravity + React. Each one drives the feature its doc page
 * teaches and checks the effect the page promises. A missing effect calls ctx.fail, so a
 * broken page records as a failing clip instead of a quiet pass.
 */

async function settle(page: Page, msgCount: number, ctx: ActionContext): Promise<void> {
  try {
    await waitForAgentResponseCompletion(page, 2500, msgCount);
  } catch (e) {
    ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`);
  }
}

/** Frontend Tools: the agent calls change_background and the page background changes. */
export const runFrontendToolsAction: PageActionHandler = async (page, config, _root, ctx) => {
  const bg = page.locator('[data-testid="frontend-tools-background"]');
  const before = await bg.getAttribute('data-background-value').catch(() => null);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const changed = await page
    .waitForFunction(
      (prev) => document.querySelector('[data-testid="frontend-tools-background"]')?.getAttribute('data-background-value') !== prev,
      before,
      { timeout: 60000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!changed) ctx.fail('change_background never ran: the background did not change.');
  await settle(page, msgCount, ctx);
  await sleep(2500);
};

/** Topic the last picker card showed (read before the slot is clicked; the card then collapses). */
let lastTopic: string | null = null;

/** HITL and useInterrupt: a picker appears in the chat, the user picks a slot, the run resumes. */
function pickSlotAction(slotLabel: string): PageActionHandler {
  return async (page: Page, config: PageRecordConfig, _root, ctx) => {
    const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
    const slot = page.getByRole('button', { name: slotLabel }).first();
    const appeared = await slot.waitFor({ state: 'visible', timeout: 90000 }).then(() => true).catch(() => false);
    if (!appeared) {
      ctx.fail(`The time picker never appeared (no "${slotLabel}" button).`);
      return;
    }
    // Show the card's header first: on the useInterrupt page it reads "a call" (payload lost, FINDINGS.md #20).
    await glideTo(page, page.getByText('Book a call', { exact: false }).first(), 2500);
    lastTopic = (await page.locator('[data-testid="time-picker-card"] h3').first().textContent().catch(() => null))?.trim() ?? null;
    await glideClick(page, slot);
    await sleep(1500);
    await settle(page, msgCount, ctx);
    await sleep(3000);
  };
}

/** Headless interrupts: the hook should surface the pending interrupt. It never does on Antigravity. */
export const runHeadlessInterruptAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const surfaced = await page
    .getByRole('button', { name: 'Tomorrow 2:00 PM' })
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!surfaced) mark('error');
  await glideTo(page, page.locator('[data-testid="app-surface"]'), 3000);
  await writeFinding(page, config.id, config);
  if (!surfaced) ctx.fail('Headless hook never received the interrupt: "no pending interrupt" (FINDINGS.md #31).');
};

/** Shared State: the UI writes a name into state, the agent reads it and writes a note back. */
export const runSharedStateAction: PageActionHandler = async (page, config, _root, ctx) => {
  const name = page.locator('[data-testid="pref-name"]');
  await glideClick(page, name);
  await name.pressSequentially('Zara', { delay: 120 });
  await name.blur();
  await sleep(1200);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const noted = await page
    .locator('[data-testid="notes-list"] li')
    .first()
    .waitFor({ state: 'visible', timeout: 90000 })
    .then(() => true)
    .catch(() => false);
  if (!noted) ctx.fail('set_notes never updated the notes panel.');
  await settle(page, msgCount, ctx);
  await glideTo(page, page.locator('[data-testid="notes-list"]'), 2500);
};

/** Inspector: run one turn, open the launcher, walk the panes the doc names. */
export const runInspectorAction: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  await settle(page, msgCount, ctx);
  const inspector = page.locator('cpk-web-inspector');
  if ((await inspector.count()) === 0) {
    ctx.fail('No <cpk-web-inspector> on the page.');
    return;
  }
  await glideClick(page, inspector.locator('button').first());
  await sleep(2500);
  for (const pane of ['Agent', 'AG-UI Events', 'Frontend Tools', 'Rich Threads']) {
    const link = inspector.getByText(pane, { exact: true }).first();
    if (await link.isVisible().catch(() => false)) {
      await glideClick(page, link);
      await sleep(3500);
    } else if (pane !== 'Frontend Tools') {
      ctx.warn(`Inspector pane "${pane}" not found.`);
    }
  }
};

export const runHitlAction = pickSlotAction('Tomorrow 2:00 PM');
const pickSlot = pickSlotAction('Tomorrow 2:00 PM');
/**
 * useInterrupt (level 2, ❌): runs only on harness wiring (the page's backend is LangGraph, #19, and
 * `gen-ui-interrupt` is never registered, #22). Even then the card reads "a call": the doc's
 * frontend reads `event.value`, empty for an Antigravity interrupt (#20).
 */
export const runUseInterruptAction: PageActionHandler = async (page, config, root, ctx) => {
  lastTopic = null;
  await pickSlot(page, config, root, ctx);
  if (lastTopic === 'a call') {
    mark('error', 'card header reads "a call": interrupt payload lost (event.value)');
    ctx.fail('The card shows "a call" instead of the topic: event.value is empty for Antigravity (FINDINGS.md #20). Backend on the page is LangGraph (#19).');
  }
  await writeFinding(page, config.id, config);
};

/** State Rendering: set_steps streams the plan into agent state; the steps panel re-renders mid-run. */
export const runStateRenderingAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const firstStep = page.locator('[data-testid="step-item"]').first();
  const appeared = await firstStep.waitFor({ state: 'visible', timeout: 120000 }).then(() => true).catch(() => false);
  if (!appeared) {
    mark('error');
    ctx.fail('set_steps never rendered: the steps panel stayed empty.');
    return;
  }
  mark('action', 'steps rendered from agent state');
  await glideTo(page, page.locator('[data-testid="steps-panel"]'), 2000);
  // The agent mostly talks through set_steps tool calls, not chat text, so the chat-reply wait
  // gives up early. Follow the run itself: the LIVE badge (OnRunStatusChanged) goes away at the end.
  const finished = await page
    .locator('[data-testid="live-badge"]')
    .waitFor({ state: 'detached', timeout: 240000 })
    .then(() => true)
    .catch(() => false);
  if (!finished) ctx.warn('Run still LIVE after 4 minutes.');
  await sleep(2000);
  const statuses = await page.locator('[data-testid="step-item"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
  if (!statuses.length || statuses.some((s) => s !== 'completed')) {
    ctx.warn(`Run ended with steps not all completed: ${statuses.join(', ')}`);
  }
  await glideTo(page, page.locator('[data-testid="steps-progress"]'), 2500);
};

/** Sub-Agents: the supervisor delegates; each sub-agent call lands in the delegation log mid-run. */
export const runSubagentsAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runSubagentsTake(page, config, root, ctx);
  } finally {
    // Re-audit 2026-11-20: ✅ (httpx install gap is a minor note, FINDINGS.md #49); no notes entry, so no Notepad.
    await writeFinding(page, config.id, config);
  }
};

const runSubagentsTake: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const entries = page.locator('[data-testid="delegation-entry"]');
  // Stop waiting as soon as the run errors (e.g. "fetch failed" when the sub-agents server is
  // down, FINDINGS.md #49): minutes of a frozen chat explain nothing.
  const runError = page.locator('[data-testid="copilot-error-banner"]').or(page.getByText(/fetch failed|Agent error/i)).first();
  const outcome = await Promise.race([
    entries.first().waitFor({ state: 'visible', timeout: 180000 }).then(() => 'delegated' as const),
    runError.waitFor({ state: 'visible', timeout: 180000 }).then(() => 'error' as const),
  ]).catch(() => 'timeout' as const);
  if (outcome !== 'delegated') {
    mark('error');
    if (outcome === 'error') await glideTo(page, runError, 2500).catch(() => {});
    await sleep(3000);
    ctx.fail(
      outcome === 'error'
        ? 'The run failed before any delegation (error shown in the chat).'
        : 'No delegation ever reached the log (agent.state.delegations stayed empty).',
    );
    return;
  }
  mark('action', 'first delegation in the log');
  await glideTo(page, entries.first(), 2000);
  // The supervisor goes quiet between sub-agents for longer than the settle grace, so the
  // 2026-11-24 take stopped after writing. Wait (bounded) for the third sub-agent first.
  await page
    .locator('[data-testid="subagent-indicators"] [data-fired="true"]')
    .nth(2)
    .waitFor({ state: 'attached', timeout: 240000 })
    .catch(() => {});
  await settle(page, msgCount, ctx);
  const fired = await page
    .locator('[data-testid="subagent-indicators"] [data-fired="true"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-role')));
  if (fired.length < 3) ctx.warn(`Supervisor called only: ${fired.join(', ') || 'none'} (doc: research, write, critique).`);
  await glideTo(page, page.locator('[data-testid="delegation-count"]'), 1500);
  // Scroll the log (the wheel scrolls what is under the cursor) so every delegation is seen.
  await glideTo(page, entries.first(), 500);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 250);
    await sleep(700);
  }
  await sleep(1500);
};

/** Open, close, and feedback: the sidebar starts closed, so open it with the page's own button first. */
export const runChatControlsAction: PageActionHandler = async (page, config, root, ctx) => {
  const open = page.getByRole('button', { name: 'Ask the assistant' }).first();
  if (await open.isVisible({ timeout: 10000 }).catch(() => false)) {
    mark('click', 'Ask the assistant');
    await glideClick(page, open);
    await sleep(1500);
  } else {
    ctx.warn('No "Ask the assistant" button on the page.');
  }
  await runStandardAction(page, config, root, ctx);
};

// ---------------------------------------------------------------------------------------------
// Threads pages, tested with the CopilotKit Intelligence key (2026-11-10). Runtime:
// frontend/app/api/copilotkit-threads (the headless page's server.ts). Threads are per user
// (antigravity-qa-user) and persist between runs, so older rows can already be listed.
// ---------------------------------------------------------------------------------------------
const DRAWER_ROW = 'copilotkit-threads-drawer li[role="option"][data-thread-id]';
const promptHead = (config: PageRecordConfig) => config.prompt.slice(0, 24);

/** Threads Drawer: chat once, the thread is listed, New Conversation resets the chat, the row replays it. */
export const runThreadsDrawerAction: PageActionHandler = async (page, config, root, ctx) => {
  await page.locator('copilotkit-threads-drawer').first().waitFor({ state: 'attached', timeout: 30000 }).catch(() => {});
  await sleep(3000); // the drawer loads its list
  const rowsBefore = await page.locator(DRAWER_ROW).count();
  await runStandardAction(page, config, root, ctx);
  const mine = page.locator(DRAWER_ROW).filter({ hasText: promptHead(config) });
  const listed = await page
    .waitForFunction((n) => (document.querySelector('copilotkit-threads-drawer')?.shadowRoot
      ?.querySelectorAll('li[role="option"][data-thread-id]').length ?? 0) > n, rowsBefore, { timeout: 45000, polling: 500 })
    .then(() => true)
    .catch(() => false);
  void checkpoint('thread', 'the new conversation is listed in the drawer', async () => `${await page.locator(DRAWER_ROW).count()} row(s), was ${rowsBefore}`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The Threads Drawer did not list the new conversation.');
    return;
  }
  await sleep(4000); // the thread name fills in
  await glideTo(page, page.locator(DRAWER_ROW).first(), 2000);
  mark('click', 'New Conversation');
  await glideClick(page, page.getByText('New Conversation', { exact: true }).first());
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const reset = await userBubble.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false);
  void checkpoint('new', '"New Conversation" clears the chat', async () => reset);
  if (!reset) ctx.fail('"New Conversation" did not reset the chat.');
  await sleep(2500);
  mark('click', 'reopen thread');
  const row = (await mine.count()) > 0 ? mine.first() : page.locator(DRAWER_ROW).first();
  await glideClick(page, row);
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread in the drawer did not replay its conversation.');
  await sleep(4000);
};

/** Headless Threads: chat once, the useThreads sidebar lists it, selecting another row switches the chat, and back. */
export const runHeadlessThreadsAction: PageActionHandler = async (page, config, root, ctx) => {
  await runStandardAction(page, config, root, ctx);
  // The doc's ThreadSidebar (2026-11-18): <div><button>{name}</button><button>Rename</button><button>Archive</button></div>
  const rows = page.locator('div:has(> button:text-is("Rename")) > button:first-child');
  const listed = await rows.first().waitFor({ state: 'visible', timeout: 45000 }).then(() => true).catch(() => false);
  void checkpoint('thread', 'the useThreads sidebar lists the thread (Rename / Archive row)', async () => `${await rows.count()} row(s)`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The chat ran, but the useThreads sidebar lists no threads.');
    return;
  }
  await sleep(4000); // the thread name fills in
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const other = rows.filter({ hasNotText: promptHead(config) });
  if ((await other.count()) > 0) {
    mark('click', 'other thread');
    await glideClick(page, other.first());
    const switched = await userBubble.waitFor({ state: 'hidden', timeout: 20000 }).then(() => true).catch(() => false);
    void checkpoint('switch', 'selecting another thread switches the chat away from this one', async () => switched);
    if (!switched) ctx.fail('Selecting another thread in the sidebar did not switch the chat.');
    await sleep(3000);
  }
  mark('click', 'reopen thread');
  const mine = rows.filter({ hasText: promptHead(config) });
  await glideClick(page, (await mine.count()) > 0 ? mine.first() : rows.first());
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread in the sidebar did not replay its conversation.');
  await sleep(4000);
};

/**
 * HARNESS (2026-11-13): MCP Apps. The thing under test is the Excalidraw iframe the built-in
 * MCPAppsActivityRenderer draws. The model sometimes ends the run right after the tool call with
 * no closing text (CI 2026-11-12 takes 3-4: diagram drawn, recorder waited 120 s for text). When
 * the iframe is on screen that silence is not a page failure; with no iframe it still fails.
 */
export const runMcpAppsAction: PageActionHandler = async (page, config, _root, ctx) => {
  const before = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const frame = page.locator('iframe').last();
  const drawn = await frame
    .waitFor({ state: 'visible', timeout: ctx.timeouts.replyStartMs })
    .then(() => true)
    .catch(() => false);
  void checkpoint('mcp-app', 'MCP App iframe rendered', () => drawn);
  if (!drawn) {
    // No iframe: judge the turn the standard way (silence or text without a diagram).
    await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, before, undefined, {
      startTimeoutMs: 20000,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    });
    ctx.fail('No MCP App rendered: the agent reply came without the Excalidraw iframe.');
    return;
  }
  await glideTo(page, frame, 1500);
  // The model may close with a sentence, or end right after the tool call: wait briefly for either.
  await waitForAgentResponseCompletion(page, 6000, before, undefined, { startTimeoutMs: 25000, streamTimeoutMs: ctx.timeouts.replyStreamMs })
    .catch((e) => {
      if (!(e instanceof AgentSilentError)) throw e;
      console.log('   ✅ MCP App iframe rendered; the agent ended without closing text.');
    });
  await glideTo(page, frame, 4000);
};

/**
 * Voice (FINDINGS.md #63). HARNESS: the stub `voice-chat.tsx` keeps the rest of the app alive, so the
 * real "Module not found" error never reached the server log and the end-of-clip terminal showed
 * unrelated lines. Before the take, the stub is moved aside for one real request to /voice, so the
 * dev server prints the genuine build error into logs/frontend-3040.log, then put back.
 */
export const runVoiceAction: PageActionHandler = async (page, config, root, ctx) => {
  const { renameSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const repo = existsSync(join(root, 'frontend')) ? root : join(root, '..');
  const stub = join(repo, 'frontend', 'app', 'voice', 'voice-chat.tsx');
  const aside = stub + '.aside';
  // The demo shows the verbatim page: the placeholder is moved aside for the whole demo so the real
  // Next "Module not found" overlay is what the viewer sees (review 2026-11-16: the placeholder's own
  // text was on camera). Pages record one at a time, so blanking the dev server for these
  // seconds breaks no other take; the placeholder is always put back in `finally`.
  // HARNESS (re-audit 2026-11-20, owner): the page says to render <CopilotChat /> in place of <VoiceChat />,
  // so voice-chat.tsx now renders CopilotChat and the page is judged on the voice feature itself.
  // Set VOICE_SHOW_MODULE_NOT_FOUND=1 to film the old verbatim "Module not found" take.
  const showOld = process.env.VOICE_SHOW_MODULE_NOT_FOUND === '1';
  if (!showOld) { await runStandardAction(page, config, root, ctx); return; }
  const moved = existsSync(stub);
  if (moved) renameSync(stub, aside);
  try {
    if (moved) {
      await sleep(1500);
      await page.reload().catch(() => null);
      await page.getByText(/Module not found/i).first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
      mark('error', "Module not found: Can't resolve './voice-chat'");
      await sleep(5000);
    }
    await runStandardWithFinding(page, config, root, ctx);
  } finally {
    if (moved && existsSync(aside)) renameSync(aside, stub);
  }
  ctx.fail("Module not found: Can't resolve './voice-chat' (page.tsx imports a file the doc never shows).");
};
