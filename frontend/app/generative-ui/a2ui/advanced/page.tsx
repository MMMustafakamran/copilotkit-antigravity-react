"use client";
// Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/advanced -- "Pass it to the provider", src/app/page.tsx (verbatim, HARNESS lines marked)

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { A2UIProgress } from "./components/a2ui-progress"; // HARNESS: doc imports "@/components/a2ui-progress"; the file sits next to this route.
// HARNESS: the page says it applies "When using Dynamic Schema A2UI" and "If you also pass a catalog, put both in the
// same object: a2ui={{ catalog: myCatalog, loadingComponent: A2UIProgress }}". Catalog, runtime and agent are the
// Dynamic Schema page's (harness route /api/copilotkit-declarative-gen-ui, agent declarative-gen-ui); the doc's
// <CopilotKit runtimeUrl="/api/copilotkit"> names no agent.
import { myCatalog } from "../dynamic-schema/a2ui/catalog";

export default function Page() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-declarative-gen-ui" // HARNESS: doc "/api/copilotkit", see above
      agent="declarative-gen-ui" // HARNESS: see above
      a2ui={{ catalog: myCatalog, loadingComponent: A2UIProgress }}
    >
      <CopilotChat className="flex-1" agentId="declarative-gen-ui" /* HARNESS: agentId, see above */ />
    </CopilotKit>
  );
}
