"use client";
// HARNESS: the Styling page shows only theme.css and the layout import; it styles "the A2UI v0.9 surfaces
// you render through the a2ui prop" but names no surface, catalog or agent. The surface here is the Fixed
// Schema page's flight card (its catalog, chat and agent, harness route /api/copilotkit-a2ui-fixed-schema),
// which links to this page.
import React from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

import { catalog } from "../fixed-schema/a2ui/catalog";
import { Chat } from "../fixed-schema/chat";

export default function A2UIStylingDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-a2ui-fixed-schema"
      agent="a2ui-fixed-schema"
      a2ui={{ catalog }}
    >
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}
