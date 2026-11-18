"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { ToolRenderers } from "./tool-renderers";

export default function Page() {
return (
  // Use the agent name you registered on CopilotRuntime
  // HARNESS: the doc writes agent="default" / agentId="default" under the comment above; the name registered for this page (Code tab route.ts) is "tool-rendering", so it is used here as the comment says.
  <CopilotKit runtimeUrl="/api/copilotkit" agent="tool-rendering">
    <ToolRenderers />
    <CopilotChat agentId="tool-rendering" />
  </CopilotKit>
);
}
