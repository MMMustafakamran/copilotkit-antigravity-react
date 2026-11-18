// Segment gate: a no-op in this copy (nothing to wait for between segments).
export function setVoiceEnabled(_on: boolean): void {}
export function loadVoicePlan(_root: string, _pageId: string, _clip: string): void {}
export async function voiceGate(_nextLabel: string): Promise<void> {}
export async function voiceTail(): Promise<void> {}
export function notepadVoiceMs(): number {
  return 0;
}
