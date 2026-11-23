// --- Doc: https://docs.copilotkit.ai/google-antigravity/voice (Next.js API route, verbatim) ---
// src/app/api/copilotkit-voice/[[...slug]]/route.ts
import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { createTranscriptionService } from "@/lib/transcription-service";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

// HARNESS (2026-11-20): the doc route points at ${AGENT_URL}/voice, an agent the Voice page never shows;
// the voice feature is transcription on the runtime, so any agent works -> the quickstart agent at /.
// Doc line: const voiceDemoAgent = new HttpAgent({ url: `${AGENT_URL}/voice` });
const voiceDemoAgent = new HttpAgent({ url: `${AGENT_URL}/` });

let cachedHandler: ((req: Request) => Promise<Response>) | null = null;
function getHandler(): (req: Request) => Promise<Response> {
  if (cachedHandler) return cachedHandler;

  const runtime = new CopilotRuntime({
    // @ts-ignore -- see main route.ts; published agents type generic mismatch
    agents: {
      "voice-demo": voiceDemoAgent,
      default: voiceDemoAgent,
    },
    transcriptionService: createTranscriptionService(),
  });

  cachedHandler = createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit-voice",
  });
  return cachedHandler;
}

export const POST = (req: NextRequest) => getHandler()(req);
export const GET = (req: NextRequest) => getHandler()(req);
export const PUT = (req: NextRequest) => getHandler()(req);
export const DELETE = (req: NextRequest) => getHandler()(req);
