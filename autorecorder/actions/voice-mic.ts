import { type PageActionHandler } from '../core/types';
import { waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { mark } from '../core/timeline';
import { SELECTORS } from '../config/selectors.config';
import { glideClick, glideTo } from './glide-click';
/**
 * Voice: the demo uses the real mic. The take's browser plays `fakeMicWav` (pages config) as its
 * microphone (Chromium fake-media flags); click Transcribe, let the prompt play, click Finish, the
 * runtime's transcription service fills the composer, then send it and wait for the reply.
 */
export const runVoiceMicAction: PageActionHandler = async (page, _config, _root, ctx) => {
  const startBtn = page.locator('button[aria-label="Transcribe"]').first();
  const finishBtn = page.locator('button[aria-label="Finish"]').first();
  const input = page.locator('[data-testid="copilot-chat-textarea"], textarea').first();
  const assistant = SELECTORS.assistantMessage;
  if (!(await startBtn.waitFor({ state: 'visible', timeout: 30000 }).then(() => true, () => false))) {
    mark('error', 'no mic button in the composer');
    ctx.fail('No mic (Transcribe) button in the composer: the runtime does not report audioFileTranscriptionEnabled.');
    return;
  }
  const msgCount = await page.locator(assistant).count();
  await glideClick(page, startBtn);
  mark('action', 'mic on: speaking the prompt');
  await finishBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await sleep(4000); // the wav: 0.3 s lead-in, ~2 s of speech, then silence
  await glideClick(page, finishBtn);
  mark('action', 'mic off: transcribing');
  let text = '';
  const until = Date.now() + 45000;
  while (Date.now() < until && !text) {
    text = (await input.inputValue().catch(() => '')).trim();
    if (!text) await sleep(500);
  }
  console.log(`   🎙️ Transcribed: "${text}"`);
  if (!text) {
    mark('error', 'transcription left the composer empty');
    ctx.fail('Nothing was transcribed into the composer.');
    return;
  }
  await glideTo(page, input, 1500);
  await glideClick(page, page.locator(SELECTORS.chatSubmit).first());
  await waitForAgentResponseCompletion(page, 3000, msgCount, undefined, {
    startTimeoutMs: ctx.timeouts.replyStartMs,
    streamTimeoutMs: ctx.timeouts.replyStreamMs,
  }).catch((e) => ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`));
  const reply = (await page.locator(assistant).last().innerText().catch(() => '')).trim();
  console.log(`   💬 Reply: "${reply.slice(0, 200)}"`);
  if (!reply) ctx.fail(`No reply to the transcribed prompt "${text}".`);
  await glideTo(page, page.locator(assistant).last(), 2500);
};
