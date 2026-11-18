import { setVoiceEnabled } from './voice';

// Fast mode (probe): no video, no doc/IDE/Notepad, no human pacing. The page's own action still
// runs, so its checkpoint() calls decide the result. One flag for the whole process.
let fast = false;

export function setFast(on: boolean): void {
  fast = on;
  setVoiceEnabled(!on);
}

export function isFast(): boolean {
  return fast;
}
