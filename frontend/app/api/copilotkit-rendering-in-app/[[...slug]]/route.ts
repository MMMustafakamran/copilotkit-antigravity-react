// HARNESS: the Render agent state in your app page shows no backend. Its "default" agent is backed by the
// agent of the linked Shared State page (backend/shared_state_main.py :8042, experimental_app_state, get_shared_state).
import type { NextRequest } from "next/server";
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const agent = new HttpAgent({ url: "http://localhost:8042" });
const runtime = new CopilotRuntime({
  // @ts-ignore -- published agents type generic mismatch (same as the main route.ts)
  agents: { default: agent },
});
const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit-rendering-in-app" });

export const POST = (req: NextRequest) => handler(req);
export const GET = (req: NextRequest) => handler(req);
export const PUT = (req: NextRequest) => handler(req);
export const DELETE = (req: NextRequest) => handler(req);
