"use client";
// HARNESS: page.tsx imports ./voice-chat, which the Voice doc page never shows (FINDINGS.md #63, minor).
// The page says to render <CopilotChat /> in its place; this file does just that.
import { CopilotChat } from "@copilotkit/react-core/v2";

export function VoiceChat() {
  return <CopilotChat agentId="voice-demo" className="h-full" />;
}
