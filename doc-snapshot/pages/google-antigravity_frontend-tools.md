# Frontend Tools

> Let your agent interact with and update your application's UI.

<!-- interactive demo: frontend-tools -->

<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Inspect**, then **Frontend Tools**.
  Your tool and its schema are listed.

  More detail: [Inspector](/google-antigravity/inspector).
</Callout>

## What is this? [#what-is-this]

A frontend tool is a function that you register in the browser. Your agent can call it, and the function runs in the user's browser. Because the handler runs in the browser, it has direct access to component state, browser APIs, and any third-party UI library the page already uses. That's how an agent can "reach into" the app: update React state, trigger animations, read `localStorage`, pop a toast, or steer the user's view.

This page covers the "agent drives the UI" shape of frontend tools. To render a component for a tool call, see [Generative UI](/google-antigravity/generative-ui). To ask the user before a tool runs, see [Human-in-the-loop](/google-antigravity/human-in-the-loop).

## When should I use this? [#when-should-i-use-this]

Use frontend tools when your agent needs to:

- Read or modify React component state
- Access browser APIs like `localStorage`, `sessionStorage`, or cookies
- Trigger UI updates, animations, or transitions
- Show alerts, toasts, or notifications
- Interact with third-party frontend libraries

## How it works in code [#how-it-works-in-code]

<Steps>
  <Step>
    ### Nothing to wire on the agent

    The Antigravity AG-UI adapter turns every tool the frontend registers into
    a custom Antigravity tool on each run, so the agent declares no tools of
    its own for this. A component registered with `useComponent` reaches the
    model through the AG-UI request payload; when the model calls it, the
    adapter parks the call until the browser answers and hands the result back
    to the model as the tool's return value.

  </Step>
  <Step>
    ### Tell the model when to call it

    This is the part that is easy to miss. The tool arrives on every run, but a
    model with no instruction about it will answer in prose and never call it.
    Name the tool in the system instructions and say what it is for.

~~~~python title="gen_ui_tool_based.py"
from agents._common import build

SYSTEM_PROMPT = """You are a data visualization assistant.

When the user asks for a chart, call `render_bar_chart` or `render_pie_chart`
with a concise title, short description, and a `data` array of
`{label, value}` items. Pick bar for comparisons over a small set of
categories; pick pie for composition / share-of-whole.

If the user names a chart subject but does NOT supply concrete numbers
(e.g. "show me a pie chart of website traffic by source"), do NOT ask
them for data. Invent plausible illustrative sample values yourself,
call the appropriate `render_*` tool immediately, and briefly note in
the follow-up that the values are illustrative samples. Always render
the chart on the first turn -- never reply with a clarifying question
asking for the data.

Keep chat responses brief -- let the chart do the talking."""


def gen_ui_tool_based_agent():
    return build(system_instructions=SYSTEM_PROMPT)


~~~~

  </Step>
</Steps>

Register a frontend tool with `useFrontendTool`. Give it a name, a Zod schema for parameters, and a handler. The agent can then call it like any other tool and your frontend runs it in the browser.

```typescript title="src/app/demos/frontend-tools/page.tsx"
import React, { useState } from "react";
import {
  CopilotKit,
  CopilotSidebar,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { Background, DEFAULT_BACKGROUND } from "./background";
import { useFrontendToolsSuggestions } from "./suggestions";

function Chat() {
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);

  useFrontendTool({
    name: "change_background",
    description:
      "Change the page background. Accepts any valid CSS background value — colors, linear or radial gradients, etc.",
    parameters: z.object({
      background: z
        .string()
        .describe("The CSS background value. Prefer gradients."),
    }),
    handler: async ({ background }) => {
      setBackground(background);
      return { status: "success" };
    },
  });
```

The handler receives the parsed, type-safe parameters and can do anything
the browser can: update state, call an API, touch the DOM. Its return value
is sent back to the agent as the tool result so the model can reason about
what happened.

```typescript title="src/app/demos/frontend-tools/page.tsx"
    handler: async ({ background }) => {
      setBackground(background);
      return { status: "success" };
    },
```

Ask the agent to change the background to a blue gradient. The page background changes, and the agent gets `{ status: "success" }` as the tool result.

## Registering a list of tools [#registering-a-list-of-tools]

`useFrontendTool` registers one tool per call, so it cannot be called in a loop
over a list whose length changes between renders. When the set of tools comes
from state, from props, or from a backend response, use
[`useFrontendTools`](/reference/hooks/useFrontendTools) instead. It takes an
array and runs a single effect over it, so the array can be empty on one render
and hold twenty entries on the next.

```tsx
useFrontendTools(
  reports.map((report) => ({
    name: `open_${report.id}`,
    description: `Open the ${report.title} report`,
    handler: async () => navigate(`/reports/${report.id}`),
  })),
  [navigate],
);
```

On each render:

- A tool that leaves the array is unregistered.
- A tool that joins the array is registered.
- A re-render that produces an equal list does not re-register anything.

A description built from your data stays current on its own. The second argument
is for values a handler closes over, such as `navigate` above.

<IntegrationGrid path="frontend-tools" />
